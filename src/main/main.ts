/// <reference path="../renderer/preload.d.ts" />

import path from 'path';
import { promises as fs } from 'fs';
import { app, session, BrowserWindow, Tray } from 'electron';

import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { buildChromeContextMenu } from './browser/context-menu';
import { setupMenu } from './browser/menu';
import { getAssetPath, preloadPath, getRendererPath, getMainPlatform, getShellPageUrl, getBrowserWindowOpts } from './utils/app';
import { firstEl } from '../isomorphic/array';
import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from './browser/browsers';
import { onIpcMainEvent } from './utils/ipcMainEvents';
import "./streams/updater";

import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  RABBY_GETTING_STARTED_URL,
  RABBY_HOMEPAGE_URL,
  RABBY_INTERNAL_PROTOCOL,
  RABBY_SPALSH_URL,
} from '../isomorphic/constants';
import { isRabbyShellURL, isUrlFromDapp } from '../isomorphic/url';

import { dappStore, formatDapps } from './store/dapps';
import { desktopAppStore } from './store/desktopApp';
import { detectDapps } from './utils/dapps';
import { getWebuiExtId } from './streams/webui';
import { getRabbyExtId } from './streams/rabbyExt';
import { valueToMainSubject } from './streams/_init';
import { getBindLog } from './utils/log';

const mainLog = getBindLog('main', 'bgGrey');

// const pkgjson = require('../../package.json');

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
      mainLog('loadExtensions', `Loading extension from ${extPath}`);
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

const getParentWindowOfTab = (tab: Electron.WebContents) => {
  switch (tab.getType()) {
    case 'window':
      return BrowserWindow.fromWebContents(tab);
    case 'browserView':
    case 'webview':
      // return tab.getOwnerBrowserWindow();
      return BrowserWindow.fromWebContents(tab);
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

  // webuiExtensionId: Electron.Extension['id'] = '';

  appTray: Tray = undefined as any;

  constructor() {
    // eslint-disable-next-line promise/catch-or-return
    app.whenReady().then(this.init.bind(this));

    app.on('window-all-closed', () => {
      this.destroy();
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

    if ((event as any).sender) {
      win = this.getWindowFromWebContents((event as any).sender);

      // If sent from a popup window, we may need to get the parent window of the popup.
      if (!win) {
        const browserWindow = getParentWindowOfTab((event as any).sender);
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
    app.setPath(
      'userData',
      app.getPath('userData').replace('Electron', APP_NAME)
    );
    if (!IS_RUNTIME_PRODUCTION) {
      // we just need to modify it for development, because `APP_NAME` in production is from package.json
      app.setName(APP_NAME);
    }

    mainLog('::init', 'app ready, paths:');
    mainLog('::init', `desktop's home: ${app.getPath('home')}`);
    mainLog('::init', `desktop's appData: ${app.getPath('appData')}`);
    mainLog('::init', `desktop's userData: ${app.getPath('userData')}`);
    this.initSession();

    set_menu_and_icons: {
      getWebuiExtId().then(id => {
        setupMenu({
          getFocusedWebContents: () => {
            return this.getFocusedWindow().getFocusedTab()?.webContents;
          },
          topbarExtId: id,
        });
      })

      const isDarwin = getMainPlatform() === 'darwin';
      if (isDarwin) {
        app.dock.setIcon(getAssetPath('icon.png'))
      }
      this.appTray = new Tray(
        isDarwin ? getAssetPath('app-icons/macos-menu-logo-light@2x.png') : getAssetPath('app-icons/win32-tray-logo.png')
      )
      // do quit on context menu
      this.appTray.addListener('click', () => {
        // TODO: use specific `mainWindow`
        this.windows[0]?.window.show();
      });
    }

    this.session.setPreloads([preloadPath]);

    await this.session!.loadExtension(
      getAssetPath('desktop_shell'),
      { allowFileAccess: true }
    ).then((webuiExtension) => {
      valueToMainSubject('webuiExtension', webuiExtension);
    });

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
        const tabUrl = firstEl(details.url || '') || getShellPageUrl('debug-new-tab', await getWebuiExtId());

        const win = await this.createWindow({
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
        const win = this.getWindowFromBrowserWindow(browserWindow);
        win?.destroy();
      },
    });

    await loadExtensions(
      this.session!,
      getAssetPath('chrome_exts')
    );

    this._setupBridge();

    // init window
    const mainWin = await this.createWindow({
      defaultTabUrl: RABBY_HOMEPAGE_URL,
      window: {
        show: false,
      }
    });

    const showMainWin = () => {
      mainWin.window.show();
      mainWin.window.moveTop();
    };

    const splashWin = new BrowserWindow(getBrowserWindowOpts({
      width: 500,
      height: 300,
      minHeight: undefined,
      minWidth: undefined,
      resizable: false,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
    }, { zeroMinSize: true }));
    splashWin.webContents.loadURL(RABBY_SPALSH_URL);

    let gettingStartedWin: BrowserWindow | null = null;

    onIpcMainEvent('redirect-mainWindow', () => {
      if (!gettingStartedWin) return ;

      gettingStartedWin.destroy();
      showMainWin();
      gettingStartedWin = null;
    });

    // do this work on mainWin.window postMessage('homePageLoaded') until timeout
    setTimeout(() => {
      splashWin.destroy();

      if (desktopAppStore.get('firstStartApp')) {
        gettingStartedWin = new BrowserWindow({
          ...getBrowserWindowOpts(),
          transparent: true,
          frame: false,
          resizable: false,
        });
        gettingStartedWin.webContents.loadURL(RABBY_GETTING_STARTED_URL);
      } else {
        showMainWin();
      }
    }, IS_RUNTIME_PRODUCTION ? 3000 : 200);
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
      if (!IS_RUNTIME_PRODUCTION) {
        throw new Error(
          `[initSession] Failed to register protocol rabby-local`
        );
      } else {
        console.error(`Failed to register protocol`);
      }
    }
  }

  _setupBridge() {
    onIpcMainEvent('rabby-extension-id', async (event) => {
      event.reply('rabby-extension-id', {
        rabbyExtensionId: await getRabbyExtId(),
      });
    });

    onIpcMainEvent('get-app-version', (event, reqid) => {
      event.reply('get-app-version', {
        reqid,
        version: app.getVersion(),
      });
    });

    onIpcMainEvent('detect-dapp', async (event, reqid, dappUrl) => {
      const result = await detectDapps(dappUrl);

      event.reply('detect-dapp', {
        reqid,
        result,
      });
    })

    onIpcMainEvent('dapps-fetch', (event, reqid) => {
      event.reply('dapps-fetch', {
        reqid,
        dapps: formatDapps(dappStore.get('dapps')),
      });
    })

    onIpcMainEvent('dapps-put', (event, reqid: string, dapp: IDapp) => {
      // TODO: is there mutex?
      const allDapps = formatDapps(dappStore.get('dapps'));
      const existedDapp = allDapps.find((d) => d.origin === dapp.origin);
      if (existedDapp) {
        Object.assign(existedDapp, dapp);
      } else {
        allDapps.push(dapp);
      }

      dappStore.set('dapps', allDapps);

      event.reply('dapps-put', {
        reqid,
        dapps: allDapps,
      });
    });

    onIpcMainEvent('dapps-delete', (event, reqid: string, dapp: IDapp) => {
      const allDapps = dappStore.get('dapps') || [];
      const idx = allDapps.findIndex((d) => {
        return d.origin === dapp.origin;
      });

      let error: string = '';
      if (idx > -1) {
        allDapps.splice(idx, 1);
        dappStore.set('dapps', allDapps);
      } else {
        error = 'Not found';
      }

      event.reply('dapps-delete', {
        reqid,
        dapps: allDapps,
        error,
      });
    });

    onIpcMainEvent('get-desktopAppState', (event, reqid: string) => {
      desktopAppStore.set('firstStartApp', false);

      event.reply('get-desktopAppState', {
        reqid,
        state: {
          firstStartApp: desktopAppStore.get('firstStartApp')
        },
      });
    })

    onIpcMainEvent('put-desktopAppState-hasStarted', (event, reqid: string) => {
      desktopAppStore.set('firstStartApp', false);

      event.reply('put-desktopAppState-hasStarted', {
        reqid,
      });
    })
  }

  async createWindow(options: Partial<TabbedBrowserWindowOptions>) {
    const webuiExtensionId = await getWebuiExtId();
    if (!webuiExtensionId) {
      throw new Error('[createWindow] webuiExtensionId is not set');
    }
    const win = new TabbedBrowserWindow({
      ...options,
      webuiExtensionId: webuiExtensionId,
      extensions: this.extensions,
      window: getBrowserWindowOpts(options.window),
    });
    this.windows.push(win);

    // TODO: use other params to activate
    if (process.env.SHELL_DEBUG) {
      win.topbarWebContents.openDevTools({ mode: 'detach' });
    }

    return win;
  }

  async onWebContentsCreated(event: Electron.Event, webContents: BrowserWindow['webContents']) {
    const type = webContents.getType();
    const url = webContents.getURL();
    console.log(`'web-contents-created' event [type:${type}, url:${url}]`);

    // TODO: use other params to activate
    if (process.env.SHELL_DEBUG && webContents.getType() === 'backgroundPage') {
      webContents.openDevTools({ mode: 'detach', activate: true });
    }

    webContents.setWindowOpenHandler((details) => {
      const isFromDapp = isUrlFromDapp(details.url);

      switch (details.disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window': {
          const win = this.getWindowFromWebContents(webContents);
          const openedTab = isFromDapp ? win?.tabs.findByOrigin(details.url) : null;
          if (openedTab) {
            openedTab.loadURL(details.url);
          } else {
            const tab = win?.tabs.create();
            tab?.loadURL(details.url);
          }
          break;
        }
        default: {
          break;
        }
      }

      return {
        action: 'deny',
      }
    })

    webContents.on('context-menu', (_, params) => {
      const pageURL = params.pageURL || ''
      // it's shell
      if (isRabbyShellURL(pageURL) && IS_RUNTIME_PRODUCTION) return ;

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
              this.createWindow({ defaultTabUrl: winURL });
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
