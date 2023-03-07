/// <reference path="../renderer/preload.d.ts" />

import { app, contextBridge } from 'electron';
import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action';

// to injectExtensionAPIs on chrome-extension://
import '@rabby-wallet/electron-chrome-extensions/dist/preload';
import {
  RABBY_INTERNAL_PROTOCOL,
  RABBY_LOCAL_URLBASE,
} from 'isomorphic/constants';
import { ipcRendererObj, rendererHelpers } from '../preloads/base';
import pkgjson from '../../package.json';

import { setupClass } from '../preloads/setup-class';
import { setupDapp } from '../preloads/setup-dapp';
import { isExtensionBackground } from '../isomorphic/url';

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
      get appVersion() {
        return pkgjson.version;
      },
      ipcRenderer: ipcRendererObj,
      rendererHelpers,
    });
  } catch (e) {
    console.error(e);

    /**
     * some main world is set as { contextIsolation: false },
     * for those context, we can only receive message from main world
     */
    window.rabbyDesktop = {
      get appVersion() {
        return pkgjson.version;
      },
      ipcRenderer: {
        ...(isExtensionBackground(window.location.href) && {
          invoke: ipcRendererObj.invoke,
        }),
        sendMessage: ipcRendererObj.sendMessage,
      },
      rendererHelpers,
    } as any;
  }
}

if (IS_BUILTIN_WEBVIEW) {
  setupClass();
}

setupDapp();
