import { ipcMain, BrowserWindow, app, Extension } from 'electron'
import * as http from 'http'
import * as path from 'path'
import { AddressInfo } from 'net'
import { ElectronChromeExtensions } from '@rabby-wallet/electron-chrome-extensions'
import { emittedOnce } from './events-helpers'
import { addCrxPreload, createCrxSession } from './crx-helpers'

export const useServer = () => {
  const emptyPage = '<script>console.log("loaded")</script>'

  // NB. extensions are only allowed on http://, https:// and ftp:// (!) urls by default.
  let server: http.Server
  let url: string

  before(async () => {
    server = http.createServer((req, res) => {
      res.end(emptyPage)
    })
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => {
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
        resolve()
      })
    )
  })
  after(() => {
    server.close()
  })

  return {
    getUrl: () => url,
  }
}

const fixtures = path.join(__dirname, 'fixtures')

const loadedExtensions = new Map<string, ElectronChromeExtensions>();
export const useExtensionBrowser = (opts: {
  url?: () => string
  file?: string
  extensionName: string
  openDevTools?: boolean
  partitionName?: string
}) => {
  let w: Electron.BrowserWindow
  let extensions: ElectronChromeExtensions
  let extension: Extension
  let partition: string
  let customSession: Electron.Session

  beforeEach(async () => {
    const sessionDetails = createCrxSession(opts.partitionName)

    partition = sessionDetails.partition
    customSession = sessionDetails.session

    addCrxPreload(customSession)

    if (!loadedExtensions.has(sessionDetails.partitionName)) {
      const exts = new ElectronChromeExtensions({ session: customSession });
      loadedExtensions.set(sessionDetails.partitionName, exts);

      extension = await customSession.loadExtension(
        path.isAbsolute(opts.extensionName) ? opts.extensionName : path.join(fixtures, opts.extensionName)
      )
    }

    extensions = loadedExtensions.get(sessionDetails.partitionName)!;

    w = new BrowserWindow({
      show: false,
      webPreferences: { session: customSession, nodeIntegration: false, contextIsolation: true },
    })

    if (opts.openDevTools) {
      w.webContents.openDevTools({ mode: 'detach' })
    }

    extensions.addTab(w.webContents, w)

    if (opts.file) {
      await w.loadFile(opts.file)
    } else if (opts.url) {
      await w.loadURL(opts.url())
    }
  })

  afterEach(() => {
    if (!w.isDestroyed()) {
      if (w.webContents.isDevToolsOpened()) {
        w.webContents.closeDevTools()
      }

      w.destroy()
    }
  })

  return {
    get window() {
      return w
    },
    get webContents() {
      return w.webContents
    },
    get extensions() {
      return extensions
    },
    get extension() {
      return extension
    },
    get session() {
      return customSession
    },
    get partition() {
      return partition
    },

    crx: {
      async exec(method: string, ...args: any[]) {
        const p = emittedOnce(ipcMain, 'success')
        await w.webContents.executeJavaScript(
          `exec('${JSON.stringify({ type: 'api', method, args })}')`
        )
        const [, result] = await p
        return result
      },

      async eventOnce(eventName: string) {
        const p = emittedOnce(ipcMain, 'success')
        await w.webContents.executeJavaScript(
          `exec('${JSON.stringify({ type: 'event-once', name: eventName })}')`
        )
        const [, results] = await p

        if (typeof results === 'string') {
          throw new Error(results)
        }

        return results
      },
    },
  }
}

export const useBackgroundPageLogging = () => {
  app.on('web-contents-created', (event, wc) => {
    if (wc.getType() === 'backgroundPage') {
      wc.on('console-message', (ev, level, message, line, sourceId) => {
        console.log(`(${sourceId}) ${message}`)
      })
    }
  })
}
