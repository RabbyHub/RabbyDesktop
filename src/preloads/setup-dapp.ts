import { contextBridge } from 'electron';
import { isUrlFromDapp } from '../isomorphic/url';
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

export function setupDapp() {
  if (!isUrlFromDapp(window.location.href)) {
    return;
  }

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

  document.addEventListener('DOMContentLoaded', () => {
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
}
