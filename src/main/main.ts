import path from 'path';
import { promises as fs } from 'fs';
import { app, session, BrowserWindow } from 'electron';

import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions';
import { setupMenu } from './browser/menu';
import { buildChromeContextMenu } from '@rabby-wallet/electron-chrome-context-menu';
import { getAssetPath, resolveReleasePath } from './util';
import { firstEl } from '../isomorphic/array';
import TabbedBrowserWindow, { TabbedBrowserWindowOptions } from './browser/browsers';

const pkgjson = require('../../package.json');

const preloadPath = app.isPackaged
? path.join(__dirname, 'preload.js')
: path.join(__dirname, '../../.erb/dll/preload.js');
let webuiExtensionId: Electron.Extension['id'] = '';
let rabbyExtensionId: Electron.Extension['id'] = '';

const manifestExists = async (dirPath: string) => {
  if (!dirPath) return false
  const manifestPath = path.join(dirPath, 'manifest.json')
  try {
    return (await fs.stat(manifestPath)).isFile()
  } catch {
    return false
  }
}

async function loadExtensions(session: Electron.Session, extensionsPath: string) {
  const subDirectories = await fs.readdir(extensionsPath, {
    withFileTypes: true,
  })

  const extensionDirectories = await Promise.all(
    subDirectories
      .filter((dirEnt) => dirEnt.isDirectory())
      .map(async (dirEnt) => {
        const extPath = path.join(extensionsPath, dirEnt.name)

        if (await manifestExists(extPath)) {
          return extPath
        }

        const extSubDirs = await fs.readdir(extPath, {
          withFileTypes: true,
        })

        const versionDirPath =
          extSubDirs.length === 1 && extSubDirs[0].isDirectory()
            ? path.join(extPath, extSubDirs[0].name)
            : null

        if (versionDirPath && await manifestExists(versionDirPath)) {
          return versionDirPath
        }
      })
  )

  const results = []

  for (const extPath of extensionDirectories.filter(Boolean)) {
    console.log(`Loading extension from ${extPath}`)
    try {
      if (!extPath) continue ;
      const extensionInfo = await session.loadExtension(extPath, { allowFileAccess: true })
      results.push(extensionInfo)
    } catch (e) {
      console.error(e)
    }
  }

  return results
}

const getParentWindowOfTab = (tab: Electron.WebContents) => {
  switch (tab.getType()) {
    case 'window':
      return BrowserWindow.fromWebContents(tab)
    case 'browserView':
    case 'webview':
      return tab.getOwnerBrowserWindow()
    case 'backgroundPage':
      return BrowserWindow.getFocusedWindow()
    default:
      throw new Error(`Unable to find parent window of '${tab.getType()}'`)
  }
}

class Browser {
  windows: TabbedBrowserWindow[] = [];
  // @ts-ignore
  session: Electron.Session;
  // @ts-ignore
  extensions: ElectronChromeExtensions;

  constructor() {
    app.whenReady().then(this.init.bind(this))

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.destroy()
      }
    })

    app.on('web-contents-created', this.onWebContentsCreated.bind(this))
  }

  destroy() {
    app.quit()
  }

  getFocusedWindow() {
    return this.windows.find((w) => w.window.isFocused()) || this.windows[0]
  }

  getWindowFromBrowserWindow(window: BrowserWindow) {
    return !window.isDestroyed() ? this.windows.find((win) => win.id === window.id) : null
  }

  getWindowFromWebContents(webContents: BrowserWindow['webContents']) {
    const window = getParentWindowOfTab(webContents)
    return window ? this.getWindowFromBrowserWindow(window) : null
  }

  getIpcWindow(event: Electron.NewWindowWebContentsEvent) {
    let win = null

    if (event.sender) {
      win = this.getWindowFromWebContents(event.sender)

      // If sent from a popup window, we may need to get the parent window of the popup.
      if (!win) {
        const browserWindow = getParentWindowOfTab(event.sender)
        if (browserWindow && !browserWindow.isDestroyed()) {
          const parentWindow = browserWindow.getParentWindow()
          if (parentWindow) {
            win = this.getWindowFromWebContents(parentWindow.webContents)
          }
        }
      }
    }

    return win
  }

  async init() {
    this.initSession()
    setupMenu(this)

    this.session.setPreloads([preloadPath])
    this.session.setUserAgent(`${this.session.getUserAgent()} RabbyDesktop/v${pkgjson.version}`)

    this.extensions = new ElectronChromeExtensions({
      session: this.session,

      createTab: (details) => {
        const win =
          typeof details.windowId === 'number' &&
          this.windows.find((w) => w.id === details.windowId)

        if (!win) {
          throw new Error(`Unable to find windowId=${details.windowId}`)
        }

        const tab = win.tabs.create({ hasNavigationBar: win.hasNavigationBar })

        if (details.url) tab.loadURL(details.url || newTabUrl)
        if (typeof details.active === 'boolean' ? details.active : true) win.tabs.select(tab.id)

        return [tab.webContents, tab.window] as any
      },
      selectTab: (tab, browserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow)
        win?.tabs.select(tab.id)
      },
      removeTab: (tab, browserWindow) => {
        // console.log('[feat] ::removeTab tab, browserWindow', tab, browserWindow);
        console.log('[feat] ::removeTab browserWindow.id', browserWindow.id);
        const win = this.getWindowFromBrowserWindow(browserWindow)
        win?.tabs.remove(tab.id)
      },

      createWindow: async (details) => {
        console.log('[feat] ::createWindow details', details);
        const tabUrl = firstEl(details.url || '') || newTabUrl;

        const win = this.createWindow({
          initialUrl: tabUrl,
          hasNavigationBar: details.type === 'normal',
          window: {
            width: details.width,
            height: details.height,
            type: details.type,
          }
        })
        // if (details.active) tabs.select(tab.id)
        return win.window
      },
      removeWindow: (browserWindow) => {
        const win = this.getWindowFromBrowserWindow(browserWindow)
        win?.destroy()
      },
    })

    const webuiExtension = await this.session.loadExtension(
      resolveReleasePath('webui'),
      { allowFileAccess: true }
    )
    webuiExtensionId = webuiExtension.id

    const loadedExtensions = await loadExtensions(
      this.session,
      getAssetPath('chrome_plugins'),
    )

    loadedExtensions.forEach((ext) => {
      if (ext.name.toLowerCase().includes('rabby')) {
        rabbyExtensionId = ext.id;
      }
    });

    const newTabUrl = `chrome-extension://${webuiExtensionId}/new-tab.html`;
    this.createWindow({
      initialUrl: newTabUrl,
      hasNavigationBar: true,
    })
  }

  initSession() {
    this.session = session.defaultSession

    // Remove Electron and App details to closer emulate Chrome's UA
    const userAgent = this.session
      .getUserAgent()
      .replace(/\sElectron\/\S+/, '')
      .replace(new RegExp(`\\s${app.getName()}/\\S+`), '')
    this.session.setUserAgent(userAgent)
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
        width: 1280,
        height: 720,
        frame: false,
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
    })
    this.windows.push(win)

    if (process.env.SHELL_DEBUG) {
      win.webContents.openDevTools({ mode: 'detach' })
    }

    return win
  }

  async onWebContentsCreated(event, webContents: BrowserWindow['webContents']) {
    const type = webContents.getType()
    const url = webContents.getURL()
    console.log(`'web-contents-created' event [type:${type}, url:${url}]`)

    if (process.env.SHELL_DEBUG && webContents.getType() === 'backgroundPage') {
      webContents.openDevTools({ mode: 'detach', activate: true })
    }

    webContents.on('new-window', (event, url, frameName, disposition, options) => {
      event.preventDefault()

      switch (disposition) {
        case 'foreground-tab':
        case 'background-tab':
        case 'new-window':
          const win = this.getIpcWindow(event)
          const tab = win?.tabs.create()
          tab?.loadURL(url)
          break
      }
    })

    webContents.on('context-menu', (event, params) => {
      const menu = buildChromeContextMenu({
        params,
        webContents,
        extensionMenuItems: this.extensions.getContextMenuItems(webContents, params),
        openLink: (url, disposition) => {
          const win = this.getFocusedWindow()

          switch (disposition) {
            case 'new-window':
              this.createWindow({ initialUrl: url })
              break
            default:
              const tab = win.tabs.create()
              tab.loadURL(url)
          }
        },
      })

      menu.popup()
    })
  }
}

new Browser();
