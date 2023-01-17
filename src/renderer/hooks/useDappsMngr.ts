/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
// import { useDapps } from 'renderer/hooks/useDappsMngr';

import { sortDappsBasedPinned } from '@/isomorphic/dapp';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowTabs } from '../hooks-shell/useWindowTabs';
import { makeSureDappAddedToConnectedSite } from '../ipcRequest/connected-site';
import {
  deleteDapp,
  detectDapps,
  fetchDapps,
  getDapp,
  putDapp,
  toggleDappPinned,
  fetchProtocolDappsBinding,
  putProtocolDappsBinding,
} from '../ipcRequest/dapps';
import { toggleLoadingView } from '../ipcRequest/mainwin';

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

const protocolDappsBindingAtom = atom({} as Record<string, IDapp['origin'][]>);
export function useProtocolDappsBinding() {
  const [protocolDappsBinding, setProtocolDappsBinding] = useAtom(
    protocolDappsBindingAtom
  );

  const loadingRef = useRef(false);
  const fetchBindings = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    fetchProtocolDappsBinding()
      .then((newVal) => {
        setProtocolDappsBinding(newVal);
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, []);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  const bindingDappsToProtocol = useCallback(
    async (protocol: string, dappOrigins: IDapp['origin'][]) => {
      return putProtocolDappsBinding(protocol, dappOrigins).then(() => {
        fetchBindings();
      });
    },
    [fetchBindings]
  );

  return {
    protocolDappsBinding,
    bindingDappsToProtocol,
  };
}

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
      '__internal_push:dapps:changed',
      (event) => {
        if (event.dapps) setDapps(event.dapps);
        if (event.pinnedList) setPinnedList(event.pinnedList);
        if (event.unpinnedList) setUnpinnedList(event.unpinnedList);
      }
    );
  }, [setPinnedList]);

  const updateDapp = useCallback(
    async (dapp: IDapp) => {
      return putDapp(dapp);
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
      return deleteDapp(dapp);
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

const createTabedDapps = (
  list: IMergedDapp[],
  tabMap: ReturnType<typeof useWindowTabs>['tabMap']
) => {
  return list.map((item) => {
    return {
      ...item,
      tab: tabMap.get(item.origin),
    };
  });
};

export const useTabedDapps = () => {
  const { dapps, pinnedDapps, unpinnedDapps, ...rest } = useDapps();
  const { tabMap, activeTab } = useWindowTabs();
  const navigateToDapp = useNavigateToDappRoute();

  const onSelectDapp = useCallback((tab: chrome.tabs.Tab) => {
    chrome.tabs.update(tab.id!, { active: true });
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:mainwindow:select-tab',
      tab.windowId,
      tab.id!
    );
  }, []);
  const onOpenDapp = useCallback(
    (dappOrigin: string) => {
      const foundDapp = !dappOrigin
        ? null
        : dapps.find((dapp) => {
            return dapp.origin === dappOrigin;
          });

      if (activeTab && foundDapp) {
        toggleLoadingView({
          type: 'show',
          tabId: activeTab.id!,
          tabURL: dappOrigin,
        });
      }

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:open-tab',
        dappOrigin
      );
    },
    [activeTab, dapps]
  );

  const openDapp = useCallback(
    (dapp: IDappWithTabInfo) => {
      if (dapp.tab) {
        onSelectDapp(dapp.tab);
      } else {
        onOpenDapp(dapp.origin);
      }
      navigateToDapp(dapp.origin);
    },
    [onSelectDapp, onOpenDapp, navigateToDapp]
  );

  return {
    ...rest,
    openDapp,
    dapps: createTabedDapps(dapps, tabMap),
    pinnedDapps: createTabedDapps(pinnedDapps, tabMap),
    unpinnedDapps: createTabedDapps(unpinnedDapps, tabMap),
  };
};
