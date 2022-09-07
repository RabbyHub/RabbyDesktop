/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, session, BrowserView } from 'electron';
import { ElectronChromeExtensions } from 'electron-chrome-extensions';

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { getAssetPath, resolveHtmlPath } from './util';
import { FRAME_DEFAULT_SIZE, FRAME_MAX_SIZE, FRAME_MIN_SIZE } from '../isomorphic/const-size';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async (
  sessionObj: Electron.Session = session.defaultSession
) => {
  // TODO: only debug on dev or prodev
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  // const extensions = ['REACT_DEVELOPER_TOOLS'];
  const extensions: string[] = [];

  let rabbyExtension: Electron.Extension | null = null;

  return Promise.allSettled(([
    isDebug ? installer.default(
      extensions.map((name) => installer[name]),
      forceDownload
    ) : Promise.resolve(null),
    sessionObj.loadExtension(
      // getAssetPath(`chrome_plugins/rabby_v0.45.0`), { allowFileAccess: true }
      `C:\\Users\\richa\\projects\\RabbyHub\\Rabby\\dist`, { allowFileAccess: true }
    ).then(ext => {
      console.warn('[feat] rabby ext id is', ext.id);
      return ext;
    }).then(ext => {
      return rabbyExtension = ext;
    })
  ])).then(() => {
    return {
      // devTools,
      rabbyExtension
    }
  });
};

const createWindow = async () => {
  const browserSession = session.fromPartition('persist:rabby-desktop', {})
  const { rabbyExtension } = await installExtensions(browserSession);

  const extensions = new ElectronChromeExtensions({
    session: browserSession,
    // async createTab (details) {
    //   const tab = myTabApi.createTab()
    //   if (details.url) {
    //     tab.webContents.loadURL(details.url)
    //   }
    //   return [tab.webContents, tab.browserWindow]
    // },
    async selectTab (tab, browserWindow) {
      // Optionally implemented for chrome.tabs.update support
      console.warn('[feat] selectTab', tab.getTitle(), tab.isLoadingMainFrame(), tab, browserWindow);
      return [tab, browserWindow];
    },
    async removeTab (tab, browserWindow) {
      // Optionally implemented for chrome.tabs.remove support
      console.warn('[feat] removeTab', tab, browserWindow);
    },
    async createWindow (details) {
      const window = new BrowserWindow({
        webPreferences: {
          sandbox: true,
          nodeIntegration: false,
          contextIsolation: true,
        },
      })
      return window
    }
  });

  const preloadPath = app.isPackaged
  ? path.join(__dirname, 'preload.js')
  : path.join(__dirname, '../../.erb/dll/preload.js');

  mainWindow = new BrowserWindow({
    show: false,
    /* TODO: configure w/h */
    ...FRAME_DEFAULT_SIZE,
    ...FRAME_MAX_SIZE,
    ...FRAME_MIN_SIZE,
    // resizable: false,
    // autoHideMenuBar: process.env.NODE_ENV === 'production',
    icon: getAssetPath('icon.png'),
    webPreferences: {
      session: browserSession,
      preload: preloadPath,
      webviewTag: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // Adds the active tab of the browser
  extensions.addTab(mainWindow.webContents, mainWindow)

  mainWindow.loadURL(resolveHtmlPath('index.html')).then(() => {
    if (isDebug) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }

    mainWindow.webContents.send('chrome-extension-loaded', {
      name: 'rabby',
      extension: rabbyExtension
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  return { rabbyExtension }
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();

    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
