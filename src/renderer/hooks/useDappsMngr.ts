/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />
import { keyBy } from 'lodash';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import {
  getDappsInfo,
  detectDapps,
  putDapp,
  deleteDapp,
  toggleDappPinned,
} from '../ipcRequest/dapps';

const dappsAtomic = atom(null as any as IDapp[]);
const pinnedListAtomic = atom(null as any as IDapp['origin'][]);

export function useDapps() {
  const [dapps, setDapps] = useAtom(dappsAtomic);
  const [pinnedList, setPinnedList] = useAtom(pinnedListAtomic);

  useEffect(() => {
    if (dapps) return;
    // eslint-disable-next-line promise/catch-or-return
    getDappsInfo().then((newVal) => {
      setDapps(newVal.dapps);
      setPinnedList(newVal.pinnedList);
      return newVal;
    });
  }, [dapps, setDapps, setPinnedList]);

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

  const pinDapp = useCallback(
    (origin: string) => {
      toggleDappPinned([origin], true).then((newVal) => {
        setPinnedList(newVal);
      });
    },
    [setPinnedList]
  );

  const unpinDapp = useCallback(
    (origin: string) => {
      toggleDappPinned([origin], false).then((newVal) => {
        setPinnedList(newVal);
      });
    },
    [setPinnedList]
  );

  const list = useMemo(() => {
    const dappMap = keyBy(dapps || [], 'origin');
    const result: IDapp[] = [];
    (pinnedList || []).forEach((origin) => {
      if (dappMap[origin]) {
        result.push({
          ...dappMap[origin],
          isPinned: true,
        });
      }
    });

    return result.concat(
      (dapps || []).filter((dapp) => !pinnedList.includes(dapp.origin))
    );
  }, [dapps, pinnedList]);

  return {
    pinnedList,
    dapps: list,
    all: dapps || [],
    detectDapps,
    updateDapp,
    renameDapp,
    removeDapp,
    getDapp,
    pinDapp,
    unpinDapp,
  };
}
