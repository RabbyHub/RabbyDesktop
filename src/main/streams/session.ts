import { promises as fs } from 'fs';
import path from 'path';

import { protocol, session, shell } from 'electron';
import { firstValueFrom } from 'rxjs';
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { isRabbyXPage } from '@/isomorphic/url';
import {
  IS_RUNTIME_PRODUCTION,
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
import { getRabbyExtId, getWebuiExtId } from '../utils/stream-helpers';
import { checkOpenAction } from '../utils/tabs';
import { getWindowFromWebContents, switchToBrowserTab } from '../utils/browser';
import { supportHmrOnDev } from '../utils/webRequest';
import { checkProxyViaBrowserView, setSessionProxy } from '../utils/appNetwork';
import { getAppProxyConf } from '../store/desktopApp';

const sesLog = getBindLog('session', 'bgGrey');

const manifestExists = async (dirPath: string) => {
  if (!dirPath) return false;
  const manifestPath = path.join(dirPath, 'manifest.json');
  try {
    return (await fs.stat(manifestPath)).isFile();
  } catch {
    return false;
  }
};

async function loadExtensions(sess: Electron.Session, extensionsPath: string) {
  const subDirectories = await fs.readdir(extensionsPath, {
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

        const extSubDirs = await fs.readdir(extPath, {
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
          valueToMainSubject('rabbyExtensionReady', ext);
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

export async function checkProxyValidOnBootstrap() {
  const appProxyConf = getAppProxyConf();

  if (appProxyConf.proxyType === 'none') {
    return {
      valid: true,
      shouldProxy: false,
      appProxyConf,
    };
  }

  const result = await checkProxyViaBrowserView(
    'https://google.com',
    appProxyConf
  );

  return {
    valid: result.valid,
    shouldProxy: result.valid,
    appProxyConf,
  };
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'rabby-internal',
    privileges: { standard: true, supportFetchAPI: true },
  },
]);

firstValueFrom(fromMainSubject('userAppReady')).then(async () => {
  // sub.unsubscribe();
  const sessionIns = session.defaultSession;

  // // Remove Electron and App details to closer emulate Chrome's UA
  const userAgent = sessionIns.getUserAgent().replace(/\sElectron\/\S+/, '');
  sessionIns.setUserAgent(userAgent);

  if (
    !sessionIns.protocol.registerFileProtocol(
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
    )
  ) {
    if (!IS_RUNTIME_PRODUCTION) {
      throw new Error(
        `[initSession] Failed to register protocol ${RABBY_INTERNAL_PROTOCOL}`
      );
    } else {
      console.error(`Failed to register protocol`);
    }
  }

  const dappSafeViewSession = session.fromPartition('dappSafeView');
  const checkingViewSession = session.fromPartition('checkingView');
  const checkingProxySession = session.fromPartition('checkingProxy');
  valueToMainSubject('sessionReady', {
    mainSession: sessionIns,
    dappSafeViewSession,
    checkingViewSession,
    checkingProxySession,
  });

  // must after sessionReady
  const result = await checkProxyValidOnBootstrap();
  sesLog(
    `[checkProxyValidOnBootstrap] valid: ${result.valid}; shouldProxy: ${result.shouldProxy}`
  );
  if (result.shouldProxy) {
    setSessionProxy(sessionIns, result.appProxyConf);
    setSessionProxy(dappSafeViewSession, result.appProxyConf);
    setSessionProxy(checkingViewSession, result.appProxyConf);
  } else if (!result.valid) {
    sesLog('proxy config invalid! no applied');
    setSessionProxy(sessionIns, { ...result.appProxyConf, proxyType: 'none' });
    setSessionProxy(dappSafeViewSession, {
      ...result.appProxyConf,
      proxyType: 'none',
    });
    setSessionProxy(checkingViewSession, {
      ...result.appProxyConf,
      proxyType: 'none',
    });
  }
  supportHmrOnDev(sessionIns);

  sessionIns.setPreloads([preloadPath]);

  // @notice: make sure all customized plugins loaded after ElectronChromeExtensions initialized
  const chromeExtensions = new ElectronChromeExtensions({
    session: sessionIns,

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
      });

      switch (actionInfo.action) {
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

    createWindow: async (details) => {
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

  const webuiExtension = await sessionIns.loadExtension(
    getAssetPath('desktop_shell'),
    { allowFileAccess: true }
  );
  valueToMainSubject('webuiExtensionReady', webuiExtension);

  await loadExtensions(sessionIns!, getAssetPath('chrome_exts'));

  valueToMainSubject('electronChromeExtensionsReady', chromeExtensions);
});
