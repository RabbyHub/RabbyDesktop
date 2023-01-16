/// <reference path="../renderer/preload.d.ts" />

import { contextBridge } from 'electron';
import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action';

// to injectExtensionAPIs on chrome-extension://
import '@rabby-wallet/electron-chrome-extensions/dist/preload';
import {
  RABBY_INTERNAL_PROTOCOL,
  RABBY_LOCAL_URLBASE,
} from 'isomorphic/constants';
import { ipcRendererObj } from '../preloads/base';

import { setupClass } from '../preloads/setup-class';

if (
  window.location.protocol === 'chrome-extension:' &&
  window.location.pathname === '/webui.html'
) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

const IS_BUILTIN_WEBVIEW =
  ['chrome-extension:', RABBY_INTERNAL_PROTOCOL].includes(
    window.location.protocol
  ) || window.location.href.startsWith(RABBY_LOCAL_URLBASE);

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
