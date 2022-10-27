/// <reference path="../renderer/preload.d.ts" />

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { injectBrowserAction } from '@rabby-wallet/electron-chrome-extensions/dist/browser-action';

// to injectExtensionAPIs on chrome-extension://
import '@rabby-wallet/electron-chrome-extensions/dist/preload';
import { RABBY_INTERNAL_PROTOCOL } from 'isomorphic/constants';
import { isDappProtocol } from 'isomorphic/url';

if (
  window.location.protocol === 'chrome-extension:' &&
  window.location.pathname === '/shell-webui.html'
) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

const IS_SAFE_WEBVIEW = ['chrome-extension:', RABBY_INTERNAL_PROTOCOL].includes(
  window.location.protocol
);
if (IS_SAFE_WEBVIEW && !window.rabbyDesktop) {
  contextBridge.exposeInMainWorld('rabbyDesktop', {
    ipcRenderer: {
      sendMessage<T extends Channels>(
        channel: T,
        ...args: ChannelMessagePayload[T]['send']
      ) {
        ipcRenderer.send(channel, ...args);
      },
      on<T extends Channels>(
        channel: T,
        func: (...args: ChannelMessagePayload[T]['response']) => void
      ) {
        const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
          func(...(args as any));
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      },
      once<T extends Channels>(
        channel: T,
        func: (...args: ChannelMessagePayload[T]['response']) => void
      ) {
        ipcRenderer.once(channel, (_event, ...args) => func(...(args as any)));
      },
    },
  });
} else if (isDappProtocol(window.location.href) && !window.__rD) {
  contextBridge.exposeInMainWorld('__rD', {
    detectConnect: (inputParams: any) => {
      const params = inputParams || {};
      const address = params.address || window.ethereum.selectedAddress;
      const chainId = params.chainId || window.ethereum.chainId || '0x1';

      ipcRenderer.send('__internal__rabby:connect', {
        origin: window.location.origin,
        isConnected: !!address,
        chainId: chainId || '0x1',
      });
    },
  });
  // TODO: content script 抽成单独文件。origin 传递方式修改。ipc 通信修改。
  const script = document.createElement('script');
  script.innerHTML = `
  {
    Promise.all([window.ethereum.request({ method: 'eth_accounts' }), window.ethereum.request({ method: 'eth_chainId' })]).then(([accounts, chainId]) => {
      window.__rD.detectConnect({
        chainId,
        address: accounts[0]
      });
    });
    window.ethereum.on('accountsChanged', (accounts) => {
      window.__rD.detectConnect({
        address: accounts?.[0]
      });
    });
    window.ethereum.on('chainChanged', (chain) => {
      window.__rD.detectConnect({
        chainId: chain
      });
    });
  }
  `;
  window.addEventListener('DOMContentLoaded', () => {
    document.head.appendChild(script);
    script.onload = () => {
      document.head.removeChild(script);
    };
  });
}
