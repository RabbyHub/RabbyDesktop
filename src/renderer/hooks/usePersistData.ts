
/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { randString } from '../../isomorphic/string';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

async function getAll() {
  const reqid = randString();

  return new Promise<IDapp[]>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on('dapps-fetch', (event) => {
      if (event.reqid === reqid) {
        resolve(event.dapps);
      }

      dispose?.();
    });
    window.rabbyDesktop.ipcRenderer.sendMessage('dapps-fetch', reqid);
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

const dappsAtomic = atom(null as any as IDapp[]);

export function useDapps() {
  const [dapps, setDapps] = useAtom(dappsAtomic);

  useEffect(() => {
    if (dapps) return ;
    getAll().then((newVal) => {
      setDapps(newVal);
    })
  }, [ dapps ])

  return {
    dapps: dapps || [],
    updateDapp: useCallback(async (dapp: IDapp) => {
      return putDapp(dapp).then((dapps) => {
        setDapps(dapps);
      });
    }, [putDapp]),
  };
}
