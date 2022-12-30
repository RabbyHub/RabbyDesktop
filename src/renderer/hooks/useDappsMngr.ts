/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    if (originDapps) return;
    // eslint-disable-next-line promise/catch-or-return
    fetchDapps().then((newVal) => {
      setDapps(newVal.dapps);
      setPinnedList(newVal.pinnedList);

      return newVal;
    });
  }, [setPinnedList, originDapps, setDapps]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:*:pinnedListChanged',
      (event) => {
        setPinnedList(event.pinnedList);
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

  const pinDapp = useCallback((origin: string) => {
    toggleDappPinned([origin], true);
  }, []);

  const unpinDapp = useCallback((origin: string) => {
    toggleDappPinned([origin], false);
  }, []);

  /* eslint-disable @typescript-eslint/no-shadow */
  const { mergeDapps, pinnedDapps, unpinnedDapps } = useMemo(() => {
    const dappMap = new Map(
      (originDapps || []).map((dapp) => [dapp.origin, dapp])
    );

    const pinnedDapps: IMergedDapp[] = [];
    pinnedList.forEach((origin) => {
      const dapp = dappMap.get(origin);
      if (!dapp) return;

      pinnedDapps.push({
        ...dapp,
        isPinned: true,
      });
    });

    const pinnedSet = new Set(pinnedList || []);
    const unpinnedDapps: IMergedDapp[] = [];
    (originDapps || []).forEach((dapp) => {
      if (pinnedSet.has(dapp.origin)) return;
      const item = {
        ...dapp,
        isPinned: pinnedSet.has(dapp.origin),
      };

      unpinnedDapps.push(item);
    });

    return {
      mergeDapps: pinnedDapps.concat(unpinnedDapps),
      pinnedDapps,
      unpinnedDapps,
    };
  }, [originDapps, pinnedList]);
  /* eslint-enable @typescript-eslint/no-shadow */

  return {
    dapps: mergeDapps,
    pinnedList,
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
