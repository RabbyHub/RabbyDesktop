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

export async function setupDappZoomEvents() {
  const checkResult = await ipcRendererObj.invoke(
    '__internal_rpc:mainwindow:is-dapp-view'
  );
  if (!checkResult.isDappView) {
    return;
  }

  const dispose = ipcRendererObj.on(
    '__internal_push:mainwindow:set-dapp-view-zoom',
    ({ zoomPercent }) => {
      webFrame.setZoomFactor(formatZoomValue(zoomPercent).zoomFactor);
    }
  );

  document.addEventListener('beforeunload', () => {
    dispose?.();
  });
}

export async function setupDapp() {
  const checkResult = await ipcRendererObj.invoke(
    '__internal_rpc:mainwindow:is-dapp-view'
  );
  if (!checkResult.isDappView) {
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      contextBridge.exposeInMainWorld(
        '__rbCheckRequestable',
        __rbCheckRequestable
      );
    } catch (e) {
      Object.defineProperty(window, '__rbCheckRequestable', {
        value: __rbCheckRequestable,
        writable: false,
        configurable: false,
      });
    }
    const orig = (window as any).__rbCheckRequestable;

    const decriptor = Object.getOwnPropertyDescriptor(
      window,
      '__rbCheckRequestable'
    );
    if (!decriptor?.writable) return;

    Object.defineProperty(window, '__rbCheckRequestable', {
      value: orig,
      writable: false,
      configurable: false,
    });
  });

  setupDappZoomEvents();
}
