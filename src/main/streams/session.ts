import fs from 'fs';
import path from 'path';

import { app, protocol, session, shell } from 'electron';
import { firstValueFrom } from 'rxjs';
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import {
  canoicalizeDappUrl,
  isIpfsHttpURL,
  isRabbyXPage,
} from '@/isomorphic/url';
import { trimWebContentsUserAgent } from '@/isomorphic/string';
import {
  IPFS_LOCALHOST_DOMAIN,
  IS_RUNTIME_PRODUCTION,
  PROTOCOL_IPFS,
  RABBY_INTERNAL_PROTOCOL,
} from '../../isomorphic/constants';
import {
  getAssetPath,
  getRendererPath,
  getShellPageUrl,
  preloadPath,
} from '../utils/app';
import { getBindLog } from '../utils/log';
import { fromMainSubject, valueToMainSubject } from './_init';
import {
  createWindow,
  findByWindowId,
  getWindowFromBrowserWindow,
  getTabbedWindowFromWebContents,
  removeWindowRecord,
  createRabbyxNotificationWindow,
} from './tabbedBrowserWindow';
import { firstEl } from '../../isomorphic/array';
import {
  getIpfsService,
  getRabbyExtId,
  getWebuiExtId,
} from '../utils/stream-helpers';
import { checkOpenAction } from '../utils/tabs';
import { getWindowFromWebContents, switchToBrowserTab } from '../utils/browser';
import {
  rewriteSessionWebRequestHeaders,
  supportHmrOnDev,
} from '../utils/webRequest';
import { checkProxyViaBrowserView, setSessionProxy } from '../utils/appNetwork';
import { getAppProxyConf } from '../store/desktopApp';
import { createTrezorLikeConnectPageWindow } from '../utils/hardwareConnect';
import { getBlockchainExplorers } from '../store/dynamicConfig';
import { checkoutCustomSchemeHandlerInfo } from '../utils/protocol';

const sesLog = getBindLog('session', 'bgGrey');

const manifestExists = async (dirPath: string) => {
  if (!dirPath) return false;
  const manifestPath = path.join(dirPath, 'manifest.json');
  try {
    return fs.statSync(manifestPath).isFile();
  } catch {
    return false;
  }
};

async function loadExtensions(sess: Electron.Session, extensionsPath: string) {
  const subDirectories = fs.readdirSync(extensionsPath, {
    withFileTypes: true,
  });

  const extensionDirectories = await Promise.all(
    subDirectories
      // // TODO: block on hybrid compilation stage
      // .filter((dirEnt) => !dirEnt.name.includes('rabby'))
      .filter((dirEnt) => dirEnt.isDirectory())
      .map(async (dirEnt) => {
        const extPath = path.join(extensionsPath, dirEnt.name);

        if (await manifestExists(extPath)) {
          return extPath;
        }

        const extSubDirs = fs.readdirSync(extPath, {
          withFileTypes: true,
        });

        const versionDirPath =
          extSubDirs.length === 1 && extSubDirs[0].isDirectory()
            ? path.join(extPath, extSubDirs[0].name)
            : null;

        if (versionDirPath && (await manifestExists(versionDirPath))) {
          return versionDirPath;
        }
      })
  );

  const extensions: Electron.Extension[] = [];
  let rabbyExt: Electron.Extension = undefined as any;

  await Promise.allSettled(
    extensionDirectories.filter(Boolean).map(async (extPath) => {
      sesLog('loadExtensions', `Loading extension from ${extPath}`);
      try {
        if (!extPath) return;
        const ext = await sess.loadExtension(extPath, {
          allowFileAccess: true,
        });
        extensions.push(ext);
        if (ext.name.toLowerCase().includes('rabby')) {
          valueToMainSubject('rabbyExtensionLoaded', ext);
          rabbyExt = ext;
        }
      } catch (e) {
        console.error(e);
      }
    })
  );

  return extensions;
}

export async function defaultSessionReadyThen() {
  return firstValueFrom(fromMainSubject('sessionReady'));
}

function checkProxyValidOnBootstrap() {
  const appProxyConf = getAppProxyConf();

  if (appProxyConf.proxyType === 'none') {
    return {
      shouldApplyProxyOnBoot: false,
      appProxyConf,
    };
  }

  checkProxyViaBrowserView('https://google.com', appProxyConf).then(
    (result) => {
      if (!IS_RUNTIME_PRODUCTION) {
        sesLog(`[checkProxyValidOnBootstrap] valid: ${result.valid}`);
      }
    }
  );

  return {
    shouldApplyProxyOnBoot: true,
    appProxyConf,
  };
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: RABBY_INTERNAL_PROTOCOL.slice(0, -1),
    privileges: { standard: true, supportFetchAPI: true },
  },
  {
    scheme: PROTOCOL_IPFS.slice(0, -1),
    privileges: { standard: true, supportFetchAPI: true },
  },
  // {
  //   scheme: 'file:'.slice(0, -1),
  //   privileges: { standard: true, corsEnabled: false, allowServiceWorkers: true, supportFetchAPI: true },
  // },
]);

const registerCallbacks: {
  protocol: string;
  handler: (ctx: { session: Electron.Session; sessionName: string }) => {
    protocol: string;
    registerSuccess: boolean;
  };
}[] = [
  {
    protocol: RABBY_INTERNAL_PROTOCOL,
    handler: (ctx) => {
      const registerSuccess = ctx.session.protocol.registerFileProtocol(
        RABBY_INTERNAL_PROTOCOL.slice(0, -1),
        (request, callback) => {
          const pathnameWithQuery = request.url.slice(
            `${RABBY_INTERNAL_PROTOCOL}//`.length
          );

          const pathname = pathnameWithQuery.split('?')?.[0] || '';
          const pathnameWithoutHash = pathname.split('#')?.[0] || '';

          if (pathnameWithoutHash.startsWith('assets/')) {
            callback({
              path: getAssetPath(pathnameWithoutHash.slice('assets/'.length)),
            });
          } else if (pathnameWithoutHash.startsWith('local/')) {
            callback({
              path: getRendererPath(pathnameWithoutHash.slice('local/'.length)),
            });
          } else {
            // TODO: give one 404 page
            callback({
              data: 'Not found',
              mimeType: 'text/plain',
            });
          }
        }
      );

      return { registerSuccess, protocol: RABBY_INTERNAL_PROTOCOL };
    },
  },
  {
    protocol: PROTOCOL_IPFS,
    handler: (ctx) => {
      const registerSuccess = ctx.session.protocol.registerFileProtocol(
        PROTOCOL_IPFS.slice(0, -1),
        async (request, callback) => {
          const pathnameWithQuery = request.url.slice(
            `${PROTOCOL_IPFS}//`.length
          );

          const pathname = pathnameWithQuery.split('?')?.[0] || '';
          const pathnameWithoutHash = pathname.split('#')?.[0] || '';

          const ipfsService = await getIpfsService();
          let filePath = ipfsService.resolveFile(pathnameWithoutHash);

          if (!fs.existsSync(filePath)) {
            callback({ data: 'Not found', mimeType: 'text/plain' });
            return;
          }

          if (fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, './index.html');
          }

          if (!fs.existsSync(filePath)) {
            callback({ data: 'Not found', mimeType: 'text/plain' });
            return;
          }

          callback({
            path: filePath,
          });
        }
      );

      return { registerSuccess, protocol: PROTOCOL_IPFS };
    },
  },
  {
    protocol: 'http:',
    handler: (ctx) => {
      const TARGET_PROTOCOL = 'http:';
      // const unregistered = protocol.unregisterProtocol(TARGET_PROTOCOL.slice(0, -1));
      // console.log(`unregistered: ${TARGET_PROTOCOL}`, unregistered);

      const registerSuccess = protocol.interceptFileProtocol(
        TARGET_PROTOCOL.slice(0, -1),
        async (request, callback) => {
          if (!isIpfsHttpURL(request.url)) {
            // protocol.uninterceptProtocol('http');
            callback({
              data: 'Not found',
              mimeType: 'text/plain',
              statusCode: 404,
            });
            return;
          }

          const checkouted = checkoutCustomSchemeHandlerInfo(
            TARGET_PROTOCOL,
            request.url
          );
          if (!checkouted) {
            callback({
              data: 'Not found',
              mimeType: 'text/plain',
              statusCode: 404,
            });
            return;
          }

          const { fileRelPath } = checkouted;

          const ipfsService = await getIpfsService();

          let filePath = ipfsService.resolveFile(fileRelPath);

          if (!fs.existsSync(filePath)) {
            callback({
              data: 'Not found',
              mimeType: 'text/plain',
              statusCode: 404,
            });
            return;
          }

          if (fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, './index.html');
          }

          if (!fs.existsSync(filePath)) {
            callback({
              data: 'Not found',
              mimeType: 'text/plain',
              statusCode: 404,
            });
            return;
          }

          callback({
            path: filePath,
          });
        }
      );

      return { registerSuccess, protocol: TARGET_PROTOCOL };
    },
  },
];

firstValueFrom(fromMainSubject('userAppReady')).then(async () => {
  // sub.unsubscribe();
  const mainSession = session.defaultSession;

  const dappSafeViewSession = session.fromPartition('dappSafeView');
  const checkingViewSession = session.fromPartition('checkingView');
  const checkingProxySession = session.fromPartition('checkingProxy');
  valueToMainSubject('sessionReady', {
    mainSession,
    dappSafeViewSession,
    checkingViewSession,
    checkingProxySession,
  });
  const allSessions = [
    mainSession,
    dappSafeViewSession,
    checkingViewSession,
    checkingProxySession,
  ];
  allSessions.forEach((sess) => {
    // Remove Electron to closer emulate Chrome's UA
    const userAgent = trimWebContentsUserAgent(sess.getUserAgent());
    sess.setUserAgent(userAgent);

    rewriteSessionWebRequestHeaders(sess);
  });

  [
    { inst: mainSession, name: 'default' },
    {
      inst: checkingProxySession,
      name: 'checkingProxy',
      filterProtocol: ['file:', 'http:'],
    },
    {
      inst: checkingViewSession,
      name: 'checkingView',
      filterProtocol: ['file:', 'http:'],
    },
  ].forEach(({ inst, name, filterProtocol }) => {
    registerCallbacks.forEach(({ protocol: prot, handler }) => {
      if (filterProtocol?.includes(prot)) return;

      const { registerSuccess, protocol: registeredProtocol } = handler({
        session: inst,
        sessionName: name,
      });

      if (!registerSuccess) {
        if (!IS_RUNTIME_PRODUCTION) {
          throw new Error(
            `[initSession][session:${name}] Failed to register protocol ${registeredProtocol}`
          );
        } else {
          console.error(
            `[initSession][session:${name}] Failed to register protocol ${registeredProtocol}`
          );
        }
      } else {
        sesLog(
          `[initSession][session:${name}] registered protocol ${registeredProtocol} success`
        );
      }
    });
  });

  app.userAgentFallback = trimWebContentsUserAgent(mainSession.getUserAgent());

  // must after sessionReady
  const result = checkProxyValidOnBootstrap();

  const realProxy = { ...result.appProxyConf, applied: false };

  if (result.shouldApplyProxyOnBoot) {
    setSessionProxy(mainSession, realProxy);
    setSessionProxy(dappSafeViewSession, realProxy);
    setSessionProxy(checkingViewSession, realProxy);

    realProxy.applied = true;

    sesLog(`[bootstrap] proxy config applied.`);
  } else if (result.appProxyConf.proxyType !== 'none') {
    sesLog(`[bootstrap] proxy config NOT applied.`);
  } else {
    sesLog(`[bootstrap] no proxy config.`);
  }

  valueToMainSubject('appRuntimeProxyConf', realProxy);
  supportHmrOnDev(mainSession);

  mainSession.setPreloads([preloadPath]);

  // @notice: make sure all customized plugins loaded after ElectronChromeExtensions initialized
  const chromeExtensions = new ElectronChromeExtensions({
    session: mainSession,

    preloadPath,

    createTab: async (details, ctx) => {
      const win =
        typeof details.windowId === 'number' &&
        findByWindowId(details.windowId);

      if (!win) {
        throw new Error(`Unable to find windowId=${details.windowId}`);
      }

      const { sender } = ctx.event;
      const fromWc = sender.hostWebContents || sender;
      const fromWindow = getWindowFromWebContents(ctx.event.sender);

      const fromURL = fromWc.getURL();
      const rabbyExtId = await getRabbyExtId();

      const actionInfo = checkOpenAction(win.tabs, {
        fromUrl: fromURL || '',
        toUrl: details.url || '',
        fromSameWindow: fromWindow === win.window,
        rabbyExtId,
        blockchainExplorers: getBlockchainExplorers(),
      });

      switch (actionInfo.action) {
        case 'open-hardware-connect': {
          const { window, tab } = await createTrezorLikeConnectPageWindow(
            actionInfo.pageURL
          );

          return [tab.view!.webContents, window];
        }
        case 'activate-tab': {
          switchToBrowserTab(actionInfo.tabId, win);

          // TODO: make sure actionInfo.openedTab existed
          return [
            actionInfo.openedTab!.view!.webContents!,
            actionInfo.openedTab!.window!,
          ];
        }
        case 'open-external': {
          shell.openExternal(actionInfo.externalUrl);
          return false;
        }
        case 'deny': {
          return false;
        }
        default: {
          const tab = win.createTab({
            topbarStacks: {
              navigation: win.getMeta().hasNavigationBar,
            },
            initDetails: details,
          });

          if (details.url) tab.loadURL(details.url);
          else if (!IS_RUNTIME_PRODUCTION) {
            // for open new tab
            getWebuiExtId().then((webuiExtensionId) => {
              tab.loadURL(getShellPageUrl('debug-new-tab', webuiExtensionId));
            });
          }

          if (typeof details.active === 'boolean' ? details.active : true)
            win.tabs.select(tab.id);

          return [
            tab.view?.webContents as Electron.WebContents,
            tab.window,
          ] as any;
        }
      }
    },

    assignTabDetails: (details, tab) => {
      if (!details.url) {
        const window = findByWindowId(details.windowId);
        const foundTab = window?.tabs.get(tab.id);
        details.url = foundTab?.getInitialUrl() || '';
        if (foundTab && foundTab.view?.webContents) {
          details.status = foundTab.view.webContents.isLoading()
            ? 'loading'
            : 'complete';
        }
      }
    },

    selectTab: (tab, browserWindow) => {
      const win = getWindowFromBrowserWindow(browserWindow);
      win?.tabs.select(tab.id);
    },
    removeTab: (tab, browserWindow) => {
      const win = getWindowFromBrowserWindow(browserWindow);
      win?.tabs.remove(tab.id);
    },

    windowsGetCurrent: async (currentWin, { lastFocusedWindow, event }) => {
      if (!currentWin) {
        return (
          getTabbedWindowFromWebContents(event.sender)?.window ||
          lastFocusedWindow
        );
      }

      return currentWin;
    },

    createWindow: async (details, ctx) => {
      const inputUrl = firstEl(details.url || '');
      const tabUrl =
        inputUrl || getShellPageUrl('debug-new-tab', await getWebuiExtId());

      const rabbyExtId = await getRabbyExtId();
      const isNotification = isRabbyXPage(inputUrl, rabbyExtId, 'notification');

      if (isNotification) {
        return createRabbyxNotificationWindow({
          url: tabUrl,
          width: details.width,
          height: details.height,
        });
      }

      const win = await createWindow({
        defaultTabUrl: tabUrl,
        windowType: details.type,
        window: {
          width: details.width,
          height: details.height,
          type: details.type,
        },
      });
      return win.window;
    },
    removeWindow: async (browserWindow) => {
      removeWindowRecord(browserWindow).then((tabbedWin) =>
        tabbedWin?.destroy()
      );
    },
  });

  const webuiExtension = await mainSession.loadExtension(
    getAssetPath('desktop_shell'),
    { allowFileAccess: true }
  );
  valueToMainSubject('webuiExtensionReady', webuiExtension);

  await loadExtensions(mainSession!, getAssetPath('chrome_exts'));

  valueToMainSubject('electronChromeExtensionsReady', chromeExtensions);
});
