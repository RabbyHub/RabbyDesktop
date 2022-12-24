import { promises as fs } from 'fs';
import path from 'path';

import { BrowserWindow, session } from 'electron';
import { firstValueFrom } from 'rxjs';
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { isRabbyXPage } from '@/isomorphic/url';
import { NativeAppSizes } from '@/isomorphic/const-size-next';
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
  removeWindow,
} from './tabbedBrowserWindow';
import { firstEl } from '../../isomorphic/array';
import {
  getRabbyExtId,
  getWebuiExtId,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { checkOpenAction } from '../utils/tabs';
import { switchToBrowserTab } from '../utils/browser';

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
      throw new Error(`[initSession] Failed to register protocol rabby-local`);
    } else {
      console.error(`Failed to register protocol`);
    }
  }

  valueToMainSubject('sessionReady', undefined);
  sessionIns.setPreloads([preloadPath]);

  // @notice: make sure all customized plugins loaded after ElectronChromeExtensions initialized
  const chromeExtensions = new ElectronChromeExtensions({
    session: sessionIns,

    preloadPath,

    createTab: (details, ctx) => {
      const win =
        typeof details.windowId === 'number' &&
        findByWindowId(details.windowId);

      if (!win) {
        throw new Error(`Unable to find windowId=${details.windowId}`);
      }

      const { sender } = ctx.event;
      const fromWc = sender.hostWebContents || sender;
      const fromWindow = getTabbedWindowFromWebContents(ctx.event.sender);

      const actionInfo = checkOpenAction(win.tabs, {
        fromUrl: fromWc.getURL() || '',
        toUrl: details.url || '',
        fromSameWindow: fromWindow?.window === win.window,
      });

      switch (actionInfo.action) {
        case 'activate-tab': {
          switchToBrowserTab(actionInfo.tabId, win);

          return [
            actionInfo.openedTab!.webContents!,
            actionInfo.openedTab!.window!,
          ];
        }
        case 'deny': {
          return [fromWc, fromWindow];
        }
        default: {
          const tab = win.createTab({
            topbarStacks: {
              navigation: win.getMeta().hasNavigationBar,
            },
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

          return [tab.webContents, tab.window] as any;
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

      sesLog(
        '[debug] createWindow:: details, isNotification',
        details,
        isNotification
      );

      if (!isNotification) {
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
      }

      const mainWin = await onMainWindowReady();

      const mainBounds = mainWin.window.getBounds();
      const topOffset =
        NativeAppSizes.windowTitlebarHeight +
        NativeAppSizes.mainWindowDappTopOffset;
      const win = await createWindow({
        defaultTabUrl: tabUrl,
        windowType: details.type,
        isRabbyXNotificationWindow: true,
        window: {
          resizable: false,
          parent: mainWin.window,
          width: 400,
          height: mainBounds.height - topOffset,
          x: mainBounds.x + mainBounds.width - 400,
          y: mainBounds.y + topOffset,
          type: details.type,
        },
      });
      return win.window as BrowserWindow;
    },
    removeWindow: (browserWindow) => {
      const win = getWindowFromBrowserWindow(browserWindow);
      win?.destroy();

      if (win) removeWindow(win);
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
