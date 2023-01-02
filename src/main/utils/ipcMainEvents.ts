/// <reference path="../../renderer/preload.d.ts" />

import Electron, { ipcMain } from 'electron';

ipcMain.setMaxListeners(Infinity);

export function onIpcMainEvent<T extends IChannelsKey = IChannelsKey>(
  eventName: T,
  handler: (
    event: Electron.IpcMainEvent & {
      reply: {
        (eventName: T, response: ChannelMessagePayload[T]['response'][0]): any;
        <T2 extends MainInternals>(
          eventName: T2,
          response: MainInternalsMessagePayload[T2]
        ): any;
      };
    },
    ...args: ChannelMessagePayload[T]['send']
  ) => any
) {
  ipcMain.on(eventName, handler as any);

  // dispose
  const dispose = () => {
    return ipcMain.off(eventName, handler as any);
  };

  dispose.handler = handler as any;

  return dispose;
}

export function emitIpcMainEvent<T extends MainInternals = MainInternals>(
  eventName: T,
  ...args: MainInternalsMessagePayload[T]['send']
) {
  ipcMain.emit(eventName, ...args);
}

export function onIpcMainInternalEvent<T extends MainInternals = MainInternals>(
  eventName: T,
  handler: (...args: MainInternalsMessagePayload[T]['send']) => any
) {
  ipcMain.on(eventName, handler as any);

  // dispose
  const dispose = () => {
    return ipcMain.off(eventName, handler as any);
  };

  dispose.handler = handler as any;

  return dispose;
}

export function sendToWebContents<T extends IPushEvents = IPushEvents>(
  webContents: Electron.WebContents | null | undefined,
  eventName: T,
  payload: M2RChanneMessagePayload[T] extends void
    ? null
    : M2RChanneMessagePayload[T]
) {
  webContents?.send(eventName, payload);
}

export function handleIpcMainInvoke<T extends IInvokesKey = IInvokesKey>(
  eventName: T,
  handler: (
    event: Electron.IpcMainEvent,
    ...args: ChannelInvokePayload[T]['send']
  ) => ItOrItsPromise<ChannelInvokePayload[T]['response']>
) {
  ipcMain.handle(eventName, handler as any);
}
