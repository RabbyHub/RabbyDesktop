import { promises as fs } from 'fs';
import path from 'path';

import { session } from "electron";
import { firstValueFrom } from "rxjs";
import { IS_RUNTIME_PRODUCTION, RABBY_INTERNAL_PROTOCOL } from "../../isomorphic/constants";
import { getAssetPath, getRendererPath, getShellPageUrl, preloadPath } from "../utils/app";
import { getBindLog } from "../utils/log";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { createWindow, findByWindowId, getWindowFromBrowserWindow, getWindowFromWebContents } from './tabbedBrowserWindow';
import { firstEl } from '../../isomorphic/array';

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

  const results: Electron.Extension[] = [];

  await Promise.allSettled(
    extensionDirectories.filter(Boolean).map(async (extPath) => {
      sesLog('loadExtensions', `Loading extension from ${extPath}`);
      try {
        if (!extPath) return;
        const ext = await sess.loadExtension(extPath, {
          allowFileAccess: true,
        });
        results.push(ext);
        if (ext.name.toLowerCase().includes('rabby')) {
          valueToMainSubject('rabbyExtension', ext);
        }
      } catch (e) {
        console.error(e);
      }
    })
  );

  return results;
}

let chromeExtensions: ElectronChromeExtensions;
export async function getChromeExtensions () {
  await firstValueFrom(fromMainSubject('webuiExtensionReady'));
  return chromeExtensions;
}

export async function getWebuiExtId () {
  const ext = (await firstValueFrom(fromMainSubject('webuiExtensionReady')));

  sesLog('getWebuiExtId', ext.id);

  return ext.id;
};

firstValueFrom(fromMainSubject('userAppReady')).then(async () => {
  // sub.unsubscribe();
  const sessionIns = session.defaultSession;

  // // Remove Electron and App details to closer emulate Chrome's UA
  const userAgent = sessionIns
    .getUserAgent()
    .replace(/\sElectron\/\S+/, '');
  sessionIns.setUserAgent(userAgent);

  if (
    !sessionIns.protocol.registerFileProtocol(
      RABBY_INTERNAL_PROTOCOL.slice(0, -1),
      (request, callback) => {
        const pathnameWithQuery = request.url.slice(
          `${RABBY_INTERNAL_PROTOCOL}//`.length
        );

        const pathname = pathnameWithQuery.split('?')?.[0] || '';

        if (pathname.startsWith('assets/')) {
          callback({ path: getAssetPath(pathname.slice('assets/'.length)) });
        } else if (pathname.startsWith('local/')) {
          callback({
            path: getRendererPath(pathname.slice('local/'.length)),
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
        `[initSession] Failed to register protocol rabby-local`
      );
    } else {
      console.error(`Failed to register protocol`);
    }
  }

  valueToMainSubject('sessionReady', void 0);
  sessionIns.setPreloads([preloadPath]);

  // @notice: make sure all customized plugins loaded after ElectronChromeExtensions initialized
  chromeExtensions = new ElectronChromeExtensions({
    session: sessionIns,

    preloadPath,

    createTab: (details) => {
      const win = typeof details.windowId === 'number' && findByWindowId(details.windowId);

      if (!win) {
        throw new Error(`Unable to find windowId=${details.windowId}`);
      }

      const tab = win.tabs.create({
        topbarStacks: {
          navigation: win.hasNavigationBar,
        }
      });

      if (details.url) tab.loadURL(details.url);
      else if (!IS_RUNTIME_PRODUCTION) {
        getWebuiExtId().then((webuiExtensionId) => {
          tab.loadURL(getShellPageUrl('debug-new-tab', webuiExtensionId));
        });
      }

      if (typeof details.active === 'boolean' ? details.active : true)
        win.tabs.select(tab.id);

      return [tab.webContents, tab.window] as any;
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
          getWindowFromWebContents(event.sender)?.window ||
          lastFocusedWindow
        );
      }

      return currentWin;
    },

    createWindow: async (details) => {
      const tabUrl = firstEl(details.url || '') || getShellPageUrl('debug-new-tab', await getWebuiExtId());

      const win = await createWindow({
        defaultTabUrl: tabUrl,
        windowType: details.type,
        window: {
          width: details.width,
          height: details.height,
          type: details.type,
        },
      });
      // if (details.active) tabs.select(tab.id)
      return win.window;
    },
    removeWindow: (browserWindow) => {
      const win = getWindowFromBrowserWindow(browserWindow);
      win?.destroy();
    },
  });

  const webuiExtension = await sessionIns.loadExtension(getAssetPath('desktop_shell'), { allowFileAccess: true });
  valueToMainSubject('webuiExtensionReady', webuiExtension);

  await loadExtensions(
    sessionIns!,
    getAssetPath('chrome_exts')
  );
})
