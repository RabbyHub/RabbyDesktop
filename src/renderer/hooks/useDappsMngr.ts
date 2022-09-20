/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { randString } from '../../isomorphic/string';

async function getAll() {
  const reqid = randString();

  return new Promise<IDapp[]>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'dapps-fetch',
      (event) => {
        if (event.reqid === reqid) {
          resolve(event.dapps);
        }

        dispose?.();
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('dapps-fetch', reqid);
  });
}

// TODO: use timeout mechanism
async function detectDapps(dappUrl: string) {
  const reqid = randString();

  return new Promise<IDappsDetectResult>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on('detect-dapp', (event) => {
      if (event.reqid === reqid) {
        resolve(event.result);
        dispose?.();
      }
    });
    window.rabbyDesktop.ipcRenderer.sendMessage('detect-dapp', reqid, dappUrl);
  });
}

async function putDapp(dapp: IDapp) {
  const reqid = randString();

  return new Promise<IDapp[]>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on('dapps-put', (event) => {
      if (event.reqid === reqid) {
        resolve(event.dapps);
        dispose?.();
      }
    });
    window.rabbyDesktop.ipcRenderer.sendMessage('dapps-put', reqid, dapp);
  });
}

async function deleteDapp(dapp: IDapp) {
  const reqid = randString();

  return new Promise<IDapp[]>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'dapps-delete',
      (event) => {
        if (event.reqid === reqid) {
          event.error ? reject(new Error(event.error)) : resolve(event.dapps);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('dapps-delete', reqid, dapp);
  });
}

const dappsAtomic = atom(null as any as IDapp[]);

export function useDapps() {
  const [dapps, setDapps] = useAtom(dappsAtomic);

  useEffect(() => {
    if (dapps) return;
    // eslint-disable-next-line promise/catch-or-return
    getAll().then((newVal) => {
      setDapps(newVal);
      return newVal;
    });
  }, [dapps, setDapps]);

  const updateDapp = useCallback(
    async (dapp: IDapp) => {
      return putDapp(dapp).then((newDapps) => {
        setDapps(newDapps);
        return newDapps;
      });
    },
    [setDapps]
  );

  const renameDapp = useCallback(
    async (dapp: IDapp, alias: string) => {
      updateDapp({ ...dapp, alias });
    },
    [updateDapp]
  );

  const removeDapp = useCallback(
    async (dapp: IDapp) => {
      return deleteDapp(dapp).then((newVal) => {
        setDapps(newVal);
        return newVal;
      });
    },
    [setDapps]
  );

  useEffect(() => {
    if (IS_RUNTIME_PRODUCTION) return ;
    // TODO: just for test
    ;(async () => {
      // const result = await detectDapps('http://www.google.com');
      // const result = await detectDapps('https://debank.com');
      const result = await detectDapps('https://app.uniswap.org');

      console.log('[feat] useDappsMngr: favicon parse result ', result);
    })();
  }, [])

  return {
    dapps: dapps || [],
    detectDapps,
    updateDapp,
    renameDapp,
    removeDapp,
  };
}
