import { BrowserWindow } from "electron";

import { onIpcMainEvent } from "../utils/ipcMainEvents";

onIpcMainEvent('__internal_rpc:browser:set-ignore-mouse-events', (event, ...args) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setIgnoreMouseEvents(...args)
})
