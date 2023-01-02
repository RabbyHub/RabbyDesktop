/// <reference path="../renderer/preload.d.ts" />

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action';

// to injectExtensionAPIs on chrome-extension://
import '@rabby-wallet/electron-chrome-extensions/dist/preload';
import { RABBY_INTERNAL_PROTOCOL } from 'isomorphic/constants';
import { setupClass } from '../preloads/setup-class';

if (
  window.location.protocol === 'chrome-extension:' &&
  window.location.pathname === '/webui.html'
) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

const IS_BUILTIN_WEBVIEW = [
  'chrome-extension:',
  RABBY_INTERNAL_PROTOCOL,
].includes(window.location.protocol);
const ipcRendererObj = {
  sendMessage<T extends IChannelsKey>(
    channel: T,
    ...args: ChannelMessagePayload[T]['send']
  ) {
    ipcRenderer.send(channel, ...args);
  },
  invoke<T extends IChannelsKey>(
    channel: T,
    ...args: ChannelMessagePayload[T]['send']
  ) {
    return ipcRenderer.invoke(channel, ...args);
  },
  on<T extends IChannelsKey>(
    channel: T,
    func: (...args: ChannelMessagePayload[T]['response']) => void
  ) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...(args as any));
    ipcRenderer.on(channel, subscription);

    return () => ipcRenderer.removeListener(channel, subscription);
  },
  once<T extends IChannelsKey>(
    channel: T,
    func: (...args: ChannelMessagePayload[T]['response']) => void
  ) {
    ipcRenderer.once(channel, (_event, ...args) => func(...(args as any)));
  },
};
if (IS_BUILTIN_WEBVIEW && !window.rabbyDesktop) {
  try {
    contextBridge.exposeInMainWorld('rabbyDesktop', {
      ipcRenderer: ipcRendererObj,
    });
  } catch (e) {
    console.error(e);

    /**
     * some main world is set as { contextIsolation: false },
     * for those context, we can only receive message from main world
     */
    window.rabbyDesktop = {
      ipcRenderer: {
        sendMessage: ipcRendererObj.sendMessage,
      },
    } as any;
  }
}

if (IS_BUILTIN_WEBVIEW) {
  setupClass();
}
