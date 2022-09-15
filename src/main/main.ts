/// <reference path="../renderer/preload.d.ts" />

import path from 'path';
import { promises as fs } from 'fs';
import { app, session, BrowserWindow, ipcMain } from 'electron';

import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { buildChromeContextMenu } from '@rabby-wallet/electron-chrome-context-menu';
import { setupMenu } from './browser/menu';
import { getAssetPath, preloadPath, getRendererPath } from './util';
import { firstEl } from '../isomorphic/array';
import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from './browser/browsers';
import {
  FRAME_DEFAULT_SIZE,
  FRAME_MAX_SIZE,
  FRAME_MIN_SIZE,
} from '../isomorphic/const-size';
import {
  APP_NAME,
  RABBY_HOMEPAGE_URL,
  RABBY_INTERNAL_PROTOCOL,
} from '../isomorphic/constants';

import { dappStore } from './store/dapps';

// const pkgjson = require('../../package.json');

const isProd = process.env.NODE_ENV === 'production';

let webuiExtensionId: Electron.Extension['id'] = '';
let rabbyExtensionId: Electron.Extension['id'] = '';

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
      console.log(`Loading extension from ${extPath}`);
      try {
        if (!extPath) return;
        const extensionInfo = await sess.loadExtension(extPath, {
          allowFileAccess: true,
        });
        results.push(extensionInfo);
      } catch (e) {
        console.error(e);
      }
    })
  );

  return results;
}

const getParentWindowOfTab = (tab: Electron.WebContents) => {
  switch (tab.getType()) {
    case 'window':
      return BrowserWindow.fromWebContents(tab);
    case 'browserView':
    case 'webview':
      return tab.getOwnerBrowserWindow();
    case 'backgroundPage':
      return BrowserWindow.getFocusedWindow();
    default:
      throw new Error(`Unable to find parent window of '${tab.getType()}'`);
  }
};

class Browser {
  windows: TabbedBrowserWindow[] = [];

  session: Electron.Session = undefined as any;

  extensions: ElectronChromeExtensions = undefined as any;

  constructor() {
    // eslint-disable-next-line promise/catch-or-return
    app.whenReady().then(this.init.bind(this));

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.destroy();
      }
    });

    app.on('web-contents-created', this.onWebContentsCreated.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  destroy() {
    app.quit();
  }

  getFocusedWindow() {
    return this.windows.find((w) => w.window.isFocused()) || this.windows[0];
  }

  getWindowFromBrowserWindow(window: BrowserWindow) {
    return !window.isDestroyed()
      ? this.windows.find((win) => win.id === window.id)
      : null;
  }

  getWindowFromWebContents(webContents: BrowserWindow['webContents']) {
    const window = getParentWindowOfTab(webContents);
    return window ? this.getWindowFromBrowserWindow(window) : null;
  }

  getIpcWindow(event: Electron.NewWindowWebContentsEvent) {
    let win = null;

    if (event.sender) {
      win = this.getWindowFromWebContents(event.sender);

      // If sent from a popup window, we may need to get the parent window of the popup.
      if (!win) {
        const browserWindow = getParentWindowOfTab(event.sender);
        if (browserWindow && !browserWindow.isDestroyed()) {
          const parentWindow = browserWindow.getParentWindow();
          if (parentWindow) {
            win = this.getWindowFromWebContents(parentWindow.webContents);
          }
        }
      }
    }

    return win;
  }

  async init() {
    app.setPath('userData', app.getPath('userData').replace('Electron', APP_NAME));
    if (!isProd) {
      // we just need to modify it for development, because `APP_NAME` in production is from package.json
      app.setName(APP_NAME);
    }

    // TODO: use colorful logs
    console.debug('[init] app ready, paths:');
    console.debug(`[init] desktop's home: ${app.getPath('home')}`);
    console.debug(`[init] desktop's appData: ${app.getPath('appData')}`);
    console.debug(`[init] desktop's userData: ${app.getPath('userData')}`);
    this.initSession();
    setupMenu(this);

    this.session.setPreloads([preloadPath]);

    const webuiExtension = await this.session!.loadExtension(
      getAssetPath('desktop_shell'),
      { allowFileAccess: true }
    );
    webuiExtensionId = webuiExtension.id;
    const newTabUrl = `chrome-extension://${webuiExtensionId}/shell-new-tab.html`;

    // @notice: make sure all customized plugins loaded after ElectronChromeExtensions initialized
    this.extensions = new ElectronChromeExtensions({
      session: this.session,

      preloadPath,

      createTab: (details) => {
        const win =
          typeof details.windowId === 'number' &&
          this.windows.find((w) => w.id === details.windowId);

        if (!win) {
          throw new Error(`Unable to find windowId=${details.windowId}`);
        }

        const tab = win.tabs.create({ hasNavigationBar: win.hasNavigationBar });

        if (details.url) tab.loadURL(details.url || newTabUrl);
        if (typeof details.active === 'boolean' ? details.active : true)
          win.tabs.select(tab.id);

        return [tab.webContents, tab.window] as any;
      },
      selectTab: (tab, browserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.tabs.select(tab.id);
      },
      removeTab: (tab, browserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.tabs.remove(tab.id);
      },

      windowsGetCurrent: async (currentWin, { lastFocusedWindow, event }) => {
        if (!currentWin) {
          return (
            this.getWindowFromWebContents(event.sender)?.window ||
            lastFocusedWindow
          );
        }

        return currentWin;
      },

      createWindow: async (details) => {
        const tabUrl = firstEl(details.url || '') || newTabUrl;

        const win = this.createWindow({
          initialUrl: tabUrl,
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
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.destroy();
      },
    });

    const loadedExtensions = await loadExtensions(
      this.session!,
      getAssetPath('chrome_exts')
    );

    loadedExtensions.forEach((ext) => {
      if (ext.name.toLowerCase().includes('rabby')) {
        rabbyExtensionId = ext.id;
      }
    });

    this._setupBridge();

    // init window
    this.createWindow({
      initialUrl: isProd ? RABBY_HOMEPAGE_URL : newTabUrl,
    });
  }

  initSession() {
    this.session = session.defaultSession;

    // // Remove Electron and App details to closer emulate Chrome's UA
    const userAgent = this.session
      .getUserAgent()
      .replace(/\sElectron\/\S+/, '');
    this.session.setUserAgent(userAgent);

    if (
      !this.session.protocol.registerFileProtocol(
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
      if (!isProd) {
        throw new Error(
          `[initSession] Failed to register protocol rabby-local`
        );
      } else {
        console.error(`Failed to register protocol`);
      }
    }
  }

  _setupBridge() {
    ipcMain.on('rabby-extension-id', (event) => {
      event.reply('rabby-extension-id', {
        rabbyExtensionId,
      });
    });

    ipcMain.on('get-app-version', (event) => {
      event.reply('get-app-version', {
        version: app.getVersion(),
      });
    });

    ipcMain.on('dapps-fetch', (event, reqid: string) => {
      event.reply('dapps-fetch', {
        reqid,
        dapps: dappStore.get('dapps'),
      })
    });

    ipcMain.on('dapps-put', (event, reqid: string, dapp: IDapp) => {
      // TODO: is there mutex?
      const allDapps = dappStore.get('dapps') || [];
      const existedDapp = allDapps.find((d) => d.url === dapp.url);
      if (existedDapp) {
        Object.assign(existedDapp, dapp);
      } else {
        allDapps.push(dapp);
      }

      dappStore.set('dapps', allDapps);

      // console.log('[feat] allDapps', allDapps);

      event.reply('dapps-put', {
        reqid,
        dapps: allDapps
      })
    });
  }

  createWindow(options: Partial<TabbedBrowserWindowOptions>) {
    if (!webuiExtensionId) {
      throw new Error('[createWindow] webuiExtensionId is not set');
    }
    const win = new TabbedBrowserWindow({
      ...options,
      webuiExtensionId,
      extensions: this.extensions,
      window: {
        ...FRAME_DEFAULT_SIZE,
        ...FRAME_MAX_SIZE,
        ...FRAME_MIN_SIZE,
        width: 1280,
        height: 720,
        frame: false,
        icon: getAssetPath('icon.png'),
        resizable: false,
        ...options.window,
        webPreferences: {
          // sandbox: true,
          sandbox: false,
          nodeIntegration: false,
          // enableRemoteModule: false,
          contextIsolation: true,
          // worldSafeExecuteJavaScript: true,
          ...options.window?.webPreferences,
        },
      },
    });
    this.windows.push(win);

    if (process.env.SHELL_DEBUG) {
      win.topbarWebContents.openDevTools({ mode: 'detach' });
    }

    return win;
  }

  async onWebContentsCreated(event, webContents: BrowserWindow['webContents']) {
    const type = webContents.getType();
    const url = webContents.getURL();
    console.log(`'web-contents-created' event [type:${type}, url:${url}]`);

    if (process.env.SHELL_DEBUG && webContents.getType() === 'backgroundPage') {
      webContents.openDevTools({ mode: 'detach', activate: true });
    }

    webContents.on(
      'new-window',
      (ev, winURL, frameName, disposition, options) => {
        ev.preventDefault();

        switch (disposition) {
          case 'foreground-tab':
          case 'background-tab':
          case 'new-window': {
            const win = this.getIpcWindow(ev);
            const tab = win?.tabs.create();
            tab?.loadURL(winURL);
            break;
          }
          default: {
            break;
          }
        }
      }
    );

    webContents.on('context-menu', (_, params) => {
      const menu = buildChromeContextMenu({
        params,
        webContents,
        extensionMenuItems: this.extensions.getContextMenuItems(
          webContents,
          params
        ),
        openLink: (winURL, disposition) => {
          const win = this.getFocusedWindow();

          switch (disposition) {
            case 'new-window':
              this.createWindow({ initialUrl: winURL });
              break;
            default: {
              const tab = win.tabs.create();
              tab.loadURL(winURL);
              break;
            }
          }
        },
      });

      menu.popup();
    });
  }
}

// eslint-disable-next-line no-new
new Browser();
