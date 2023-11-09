/// <reference path="../../renderer/preload.d.ts" />

import { PROTOCOLS_SUPPORT_IPC_CALL } from '@/isomorphic/constants';
import { safeParseURL } from '@/isomorphic/url';
import Electron, { ipcMain } from 'electron';

ipcMain.setMaxListeners(Infinity);

function isWhitelistEvent(eventName: string) {
  return eventName.startsWith('__outer_rpc');
}
function isAllowedSender(eventName: string, evt: Electron.IpcMainInvokeEvent) {
  if (isWhitelistEvent(eventName)) return true;

  const webContents = evt.sender;
  if ((webContents as any).$isWebviewTab) {
    return false;
  }

  const frame = evt.senderFrame;
  if (frame.url) {
    const parsedInfo = safeParseURL(frame.url);
    if (
      !parsedInfo?.protocol ||
      !PROTOCOLS_SUPPORT_IPC_CALL.includes(parsedInfo?.protocol as any)
    )
      return false;
  }

  return true;
}

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
  const wrappedHandler = (evt: Electron.IpcMainEvent, ...args: any[]) => {
    if (!isAllowedSender(eventName, evt)) return;

    // @ts-expect-error
    return handler(evt, ...args);
  };
  ipcMain.on(eventName, wrappedHandler as any);

  // dispose
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;

    return ipcMain.off(eventName, wrappedHandler as any);
  };

  dispose.handler = handler;

  return dispose;
}

export function onIpcMainSyncEvent<T extends ISendSyncKey = ISendSyncKey>(
  eventName: T,
  handler: (
    // disable reply for calling to `ipcRenderer.sendSync`
    event: IpcMainSendSyncEvent<ChannelSendSyncPayload[T]['returnValue']>,
    ...args: ChannelSendSyncPayload[T]['send']
  ) => any
) {
  const wrappedHandler = (evt: Electron.IpcMainEvent, ...args: any[]) => {
    if (!isAllowedSender(eventName, evt)) return;

    // @ts-expect-error
    return handler(evt, ...args);
  };
  ipcMain.on(eventName, wrappedHandler as any);

  // dispose
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    return ipcMain.off(eventName, wrappedHandler as any);
  };

  dispose.handler = handler;

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
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    return ipcMain.off(eventName, handler as any);
  };

  dispose.handler = handler;

  return dispose;
}

export function onceIpcMainInternalEvent<
  T extends MainInternals = MainInternals
>(
  eventName: T,
  handler: (...args: MainInternalsMessagePayload[T]['send']) => any
) {
  ipcMain.once(eventName, handler as any);
}

export function sendToWebContents<T extends IPushEvents = IPushEvents>(
  webContents: Electron.WebContents | null | undefined,
  eventName: T & string,
  payload: M2RChanneMessagePayload[T] extends void
    ? null
    : M2RChanneMessagePayload[T]
) {
  webContents?.send(eventName, payload);
}

/**
 * @description you cannot repeat register handler for the same event
 */
export function handleIpcMainInvoke<T extends IInvokesKey = IInvokesKey>(
  eventName: T,
  handler: (
    event: Electron.IpcMainEvent,
    ...args: GetInvokeMethodParams<T>
  ) => ItOrItsPromise<GetInvokeMethodResponse<T>>
) {
  const wrappedHandler = (evt: Electron.IpcMainInvokeEvent, ...args: any[]) => {
    if (!isAllowedSender(eventName, evt)) return;

    // @ts-expect-error
    return handler(evt, ...args);
  };
  ipcMain.handle(eventName, wrappedHandler);

  // dispose
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    return ipcMain.off(eventName, wrappedHandler);
  };

  dispose.handler = handler;

  return dispose;
}
