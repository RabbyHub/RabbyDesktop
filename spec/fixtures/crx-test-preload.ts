import { contextBridge, ipcRenderer } from 'electron'
// import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action'

// This should go without saying, but you should never do this in a production
// app. These bindings are purely for testing convenience.
const apiName = 'electronTest'
const api = {
  sendIpc(channel: string, ...args: any[]) {
    return ipcRenderer.send(channel, ...args)
  },
  invokeIpc(channel: string, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
}

try {
  contextBridge.exposeInMainWorld(apiName, api)
} catch {
  // @ts-ignore
  window[apiName] = api
}

// // Inject in all test pages.
// injectBrowserAction()
