/// <reference path="../renderer/preload.d.ts" />

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { injectBrowserAction } from 'electron-chrome-extensions/dist/browser-action'


// Inject <browser-action-list> element into WebUI
if (location.protocol === 'chrome-extension:' && location.pathname === '/webui.html') {
  injectBrowserAction()
}

if (!(window as any).rabbyDesktop) {
  contextBridge.exposeInMainWorld('rabbyDesktop', {
    ipcRenderer: {
      sendMessage<T extends Channels>(channel: T, args: ChannelMessagePayload[T]['send']) {
        ipcRenderer.send(channel, ...args);
      },
      on<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]['response']) => void) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
          func(...args as any);
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      },
      once<T extends Channels>(channel: T, func: (...args: ChannelMessagePayload[T]['response']) => void) {
        ipcRenderer.once(channel, (_event, ...args) => func(...args as any));
      },
    },
  });
}
