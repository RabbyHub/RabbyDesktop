/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />
import { sortDappsBasedPinned } from '@/isomorphic/dapp';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { makeSureDappAddedToConnectedSite } from '../ipcRequest/connected-site';
import {
  fetchDapps,
  detectDapps,
  putDapp,
  deleteDapp,
  toggleDappPinned,
  getDapp,
} from '../ipcRequest/dapps';

const dappsAtomic = atom(null as null | IDapp[]);
const pinnedListAtomic = atom([] as IDapp['origin'][]);
const unpinnedListAtomic = atom([] as IDapp['origin'][]);

// function mergePinnnedList(dapps: (IDapp | IMergedDapp)[], pinnedList: IDapp['origin'][]): IMergedDapp[] {
//   const pinnedSet = new Set(pinnedList);
//   return dapps.map(dapp => {
//     return {
//       ...dapp,
//       isPinned: pinnedSet.has(dapp.origin),
//     };
//   });
// }

export function useDapps() {
  const [originDapps, setDapps] = useAtom(dappsAtomic);
  const [pinnedList, setPinnedList] = useAtom(pinnedListAtomic);
  const [unpinnedList, setUnpinnedList] = useAtom(unpinnedListAtomic);

  // only fetch dapps once
  useEffect(() => {
    if (originDapps) return;
    // eslint-disable-next-line promise/catch-or-return
    fetchDapps().then((newVal) => {
      setDapps(newVal.dapps);
      setPinnedList(newVal.pinnedList);
      setUnpinnedList(newVal.unpinnedList);

      // guard logic
      newVal.dapps.forEach((dapp) => {
        makeSureDappAddedToConnectedSite(dapp);
      });

      return newVal;
    });
  }, [setPinnedList, originDapps, setDapps]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:pinnedListChanged',
      (event) => {
        setPinnedList(event.pinnedList);
        setUnpinnedList(event.unpinnedList);
      }
    );
  }, [setPinnedList]);

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

  const pinDapp = useCallback((dappOrigin: string) => {
    toggleDappPinned([dappOrigin], true);
  }, []);

  const unpinDapp = useCallback((dappOrigin: string) => {
    toggleDappPinned([dappOrigin], false);
  }, []);

  /* eslint-disable @typescript-eslint/no-shadow */
  const { mergeDapps, pinnedDapps, unpinnedDapps } = useMemo(() => {
    const {
      allDapps: mergeDapps,
      pinnedDapps,
      unpinnedDapps,
    } = sortDappsBasedPinned(originDapps || [], pinnedList, unpinnedList);

    return {
      mergeDapps,
      pinnedDapps,
      unpinnedDapps,
    };
  }, [originDapps, pinnedList, unpinnedList]);
  /* eslint-enable @typescript-eslint/no-shadow */

  console.debug('[debug] pinnedList, unpinnedList', pinnedList, unpinnedList);
  console.debug('[debug] mergeDapps', mergeDapps);

  return {
    dapps: mergeDapps,
    pinnedList,
    unpinnedList,
    pinnedDapps,
    unpinnedDapps,
    detectDapps,
    updateDapp,
    renameDapp,
    removeDapp,
    pinDapp,
    unpinDapp,
  };
}

export function useDapp(origin?: string) {
  const [dappInfo, setDappInfo] = useState<IMergedDapp | null>(null);

  useEffect(() => {
    if (!origin) {
      setDappInfo(null);
      return;
    }

    getDapp(origin).then((newVal) => {
      setDappInfo(newVal);
    });
  }, [origin]);

  return dappInfo;
}
