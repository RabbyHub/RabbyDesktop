/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  getAllDapps,
  detectDapps,
  putDapp,
  deleteDapp,
} from '../ipcRequest/dapps';

const dappsAtomic = atom(null as any as IDapp[]);

export function useDapps() {
  const [dapps, setDapps] = useAtom(dappsAtomic);

  useEffect(() => {
    if (dapps) return;
    // eslint-disable-next-line promise/catch-or-return
    getAllDapps().then((newVal) => {
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

  const getDapp = useCallback(
    (origin: string) => {
      return dapps.find((dapp) => dapp.origin === origin);
    },
    [dapps]
  );

  return {
    dapps: dapps || [],
    detectDapps,
    updateDapp,
    renameDapp,
    removeDapp,
    getDapp,
  };
}
