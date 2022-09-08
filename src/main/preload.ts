import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { injectBrowserAction } from 'electron-chrome-extensions/dist/browser-action'

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

// Inject <browser-action-list> element into WebUI
if (location.protocol === 'chrome-extension:' && location.pathname === '/webui.html') {
  injectBrowserAction()
} else {
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
}
