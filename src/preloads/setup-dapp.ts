import { contextBridge, webFrame } from 'electron';
import { formatZoomValue } from '../isomorphic/primitive';

import { ipcRendererObj } from './base';

async function __rbCheckRequestable(reqData: any) {
  if (document.visibilityState === 'hidden') return false;

  try {
    const result = await ipcRendererObj.invoke(
      '__outer_rpc:check-if-requestable',
      reqData
    );
    if (result.error) {
      throw new Error(result.error);
    }

    return result.result;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// used for BrowserView based Tab solution
async function setupDappZoomEvents() {
  // const checkResult = await ipcRendererObj.invoke(
  //   '__outer_rpc:mainwindow:is-dapp-view'
  // );
  // if (!checkResult.isDappView) {
  //   return;
  // }
  // const dispose = ipcRendererObj.on(
  //   '__internal_push:mainwindow:set-dapp-view-zoom',
  //   ({ zoomPercent }) => {
  //     /**
  //      * TODO: disable here temporarily, for new webview tag based Tab solution, we should change <webview />
  //      */
  //     // webFrame.setZoomFactor(formatZoomValue(zoomPercent).zoomFactor);
  //   }
  // );
  // document.addEventListener('beforeunload', () => {
  //   dispose?.();
  // });
}

function nativeMountRequestable({
  isDomtContentLoaded = false,
}: {
  isDomtContentLoaded?: boolean;
} = {}) {
  if (typeof (window as any).__rbCheckRequestable === 'function') return;

  let origMethod = __rbCheckRequestable;

  try {
    contextBridge.exposeInMainWorld(
      '__rbCheckRequestable',
      __rbCheckRequestable
    );

    origMethod =
      typeof (window as any).__rbCheckRequestable === 'function'
        ? (window as any).__rbCheckRequestable
        : __rbCheckRequestable;
  } catch (e) {
    if (isDomtContentLoaded) {
      Object.defineProperty(window, '__rbCheckRequestable', {
        value: __rbCheckRequestable,
        writable: false,
        configurable: false,
      });
    }
  }

  return origMethod;
}

export async function setupDapp() {
  const checkResult = await ipcRendererObj.invoke(
    '__outer_rpc:mainwindow:is-dapp-view'
  );
  if (!checkResult.isDappView) {
    return;
  }

  nativeMountRequestable();
  document.addEventListener('DOMContentLoaded', () => {
    const orig = nativeMountRequestable({ isDomtContentLoaded: true });

    const descriptor = Object.getOwnPropertyDescriptor(
      window,
      '__rbCheckRequestable'
    );
    if (descriptor && !descriptor.writable) return;

    Object.defineProperty(window, '__rbCheckRequestable', {
      value: orig,
      writable: false,
      configurable: false,
    });
  });

  setupDappZoomEvents();
}
