import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type ChannelMessagePayload = {
  'ipc-example': [string],
  'chrome-extension-loaded': [
    {
      name: 'rabby',
      extension: Electron.Extension,
    }
  ]
}

export type Channels = keyof ChannelMessagePayload

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage<T extends Channels>(channel: T, args: ChannelMessagePayload[T]) {
      ipcRenderer.send(channel, args);
    },
    on<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args as any);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args as any));
    },
  },
});
