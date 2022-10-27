/// <reference path="../../renderer/preload.d.ts" />

import * as Rx from 'rxjs';
import { ipcMain } from 'electron';

export function fromIpcMainEvent<T extends Channels = Channels>(eventName: T) {
  type TReqArgs = ChannelMessagePayload[T]['send'];
  type TResponse = ChannelMessagePayload[T]['response'];

  // restrain same event channel reply
  type TEvent = Electron.IpcMainEvent & {
    reply: (eventName: T, response: TResponse[0]) => any;
  };

  type TPayload = { event: TEvent; args: TReqArgs };

  type THandler = (value: TPayload) => any;

  const operator =
    (handler: THandler) =>
    (event: TEvent, ...args: TReqArgs) => {
      handler({ event, args });
    };

  return Rx.fromEventPattern<TPayload>(
    (handler: THandler) => {
      ipcMain.on(eventName, operator(handler) as any);
    },
    (handler: THandler) => {
      // TODO: is that correct?
      ipcMain.off(eventName, handler);
    }
  );
}
