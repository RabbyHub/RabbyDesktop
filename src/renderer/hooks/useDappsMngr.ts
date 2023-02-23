/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { useNavigateToDappRoute } from '@/renderer/utils/react-router';

import { sortDappsBasedPinned } from '@/isomorphic/dapp';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowTabs } from '../hooks-shell/useWindowTabs';
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

const protocolDappsBindingAtom = atom({} as IProtocolDappBindings);
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
  }, [setProtocolDappsBinding]);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  const bindingDappsToProtocol = useCallback(
    async (protocol: string, item: IProtocolDappBindings[any]) => {
      return putProtocolDappsBinding(protocol, item).then(() => {
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

  // only fetch dapps once for every call to hooks
  const calledRef = useRef(false);
  useEffect(() => {
    if (calledRef.current) return;

    // eslint-disable-next-line promise/catch-or-return
    fetchDapps().then((newVal) => {
      calledRef.current = true;

      setDapps(newVal.dapps);
      setPinnedList(newVal.pinnedList);
      setUnpinnedList(newVal.unpinnedList);

      return newVal;
    });
  }, [setPinnedList, setDapps, setUnpinnedList]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:changed',
      (event) => {
        if (event.dapps) setDapps(event.dapps);
        if (event.pinnedList) setPinnedList(event.pinnedList);
        if (event.unpinnedList) setUnpinnedList(event.unpinnedList);
      }
    );
  }, [setPinnedList, setUnpinnedList, setDapps]);

  const renameDapp = useCallback(async (dapp: IDapp, alias: string) => {
    putDapp({ ...dapp, alias });
  }, []);

  const removeDapp = useCallback(async (dapp: IDapp) => {
    return deleteDapp(dapp);
  }, []);

  const pinDapp = useCallback((dappOrigin: string) => {
    toggleDappPinned([dappOrigin], true);
  }, []);

  const unpinDapp = useCallback((dappOrigin: string) => {
    toggleDappPinned([dappOrigin], false);
  }, []);

  const staticsSummary = useMemo(() => {
    const {
      secondaryDomainMeta,
      allDapps: mergeDapps,
      pinnedDapps,
      unpinnedDapps,
    } = sortDappsBasedPinned(originDapps || [], pinnedList, unpinnedList);

    return {
      secondaryDomainMeta,
      dapps: mergeDapps,
      pinnedDapps,
      unpinnedDapps,
    };
  }, [originDapps, pinnedList, unpinnedList]);

  return {
    ...staticsSummary,
    pinnedList,
    unpinnedList,
    detectDapps,
    renameDapp,
    removeDapp,
    pinDapp,
    unpinDapp,
  };
}

export function useDapp(origin?: string) {
  const [dappInfo, setDappInfo] = useState<Partial<IMergedDapp> | null>(null);

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
  tabMap: ReturnType<typeof useWindowTabs>['tabMapByOrigin']
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
  const { tabMapByOrigin, activeTab } = useWindowTabs();
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

      window.rabbyDesktop.ipcRenderer.invoke('safe-open-dapp-tab', dappOrigin);
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
    dapps: createTabedDapps(dapps, tabMapByOrigin),
    pinnedDapps: createTabedDapps(pinnedDapps, tabMapByOrigin),
    unpinnedDapps: createTabedDapps(unpinnedDapps, tabMapByOrigin),
  };
};
