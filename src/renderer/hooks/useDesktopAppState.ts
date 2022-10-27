/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { randString } from '../../isomorphic/string';

async function getDesktopAppState() {
  const reqid = randString();

  return new Promise<IDesktopAppState>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'get-desktopAppState',
      (event) => {
        if (event.reqid === reqid) {
          resolve(event.state);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('get-desktopAppState', reqid);
  });
}

async function origPutHasStarted() {
  const reqid = randString();

  return new Promise<void>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'put-desktopAppState-hasStarted',
      (event) => {
        if (event.reqid === reqid) {
          resolve();
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage(
      'put-desktopAppState-hasStarted',
      reqid
    );
  });
}

async function redirectToMainWindow() {
  window.rabbyDesktop.ipcRenderer.sendMessage('redirect-mainWindow');
}

const getStarted = atom({
  firstStartApp: true,
} as IDesktopAppState);

export function useDesktopAppState() {
  const [appState, setAppState] = useAtom(getStarted);

  useEffect(() => {
    if (appState) return;
    // eslint-disable-next-line promise/catch-or-return
    getDesktopAppState().then((newVal) => {
      setAppState(newVal);
      return newVal;
    });
  }, [appState, setAppState]);

  const putHasStarted = useCallback(async () => {
    return origPutHasStarted().then(() => {
      setAppState((old) => ({ ...old, firstStartApp: false }));
      redirectToMainWindow();
    });
  }, [setAppState]);

  return {
    appState,
    putHasStarted,
    redirectToMainWindow,
  };
}
