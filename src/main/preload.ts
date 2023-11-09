/// <reference path="../renderer/preload.d.ts" />

import { contextBridge } from 'electron';
import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action';
// import "@sentry/electron/preload";

// to injectExtensionAPIs on chrome-extension://
import '@rabby-wallet/electron-chrome-extensions/dist/preload';

import { ipcRendererObj, rendererHelpers } from '../preloads/base';
import pkgjson from '../../package.json';

import { setupClass } from '../preloads/setup-class';
import { setupDapp } from '../preloads/setup-dapp';
import { getBuiltinViewType, isExtensionBackground } from '../isomorphic/url';
import { injectMatomo } from '../preloads/global-inject';
import { injectAlertMethods } from '../preloads/setup-alert';
import { setupWindowShell } from '../preloads/setup-windowshell';

const isWindowShellPage =
  window.location.protocol === 'chrome-extension:' &&
  window.location.pathname === '/webui.html';

if (isWindowShellPage) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

const IS_BUILTIN_WEBVIEW = !!getBuiltinViewType(window.location);

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
          backgroundOn: ipcRendererObj.on,
        }),
        sendMessage: ipcRendererObj.sendMessage,
      },
      rendererHelpers,
    } as any;
  }
}

if (IS_BUILTIN_WEBVIEW) {
  setupClass();
  injectMatomo();
}

if (isWindowShellPage) {
  // Inject <browser-action-list> element into WebUI
  setupWindowShell();
}

setupDapp();
injectAlertMethods();
