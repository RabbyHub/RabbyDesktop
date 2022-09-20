/// <reference path="../../renderer/preload.d.ts" />

import Electron, { ipcMain } from "electron";

export function onIpcMainEvent<T extends Channels = Channels>(
  eventName: T,
  handler: (
    event: Electron.IpcMainEvent & { reply: (eventName: T, response: ChannelMessagePayload[T]['response'][0]) => any },
    ...args: ChannelMessagePayload[T]['send']
  ) => any
) {
  ipcMain.on(eventName, handler as any);

  // dispose
  return () => {
    return ipcMain.off(eventName, handler as any);
  }
}
