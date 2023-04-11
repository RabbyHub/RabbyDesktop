/// <reference path="../../isomorphic/types.d.ts" />

import {
  checkoutDappURL,
  formatDappHttpOrigin,
  makeDappURLToOpen,
  sortDappsBasedPinned,
} from '@/isomorphic/dapp';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowTabs } from '../hooks-shell/useWindowTabs';
import {
  deleteDapp,
  detectDapps,
  fetchDapps,
  fetchProtocolDappsBinding,
  getDapp,
  putDapp,
  putProtocolDappsBinding,
  toggleDappPinned,
} from '../ipcRequest/dapps';
import { findTabByTabID } from '../utils/tab';

const dappsAtomic = atom(null as null | IDapp[]);
const pinnedListAtomic = atom([] as IDapp['origin'][]);
const unpinnedListAtomic = atom([] as IDapp['origin'][]);
const dappsBoundTabIdsAtomic = atom({} as Record<IDapp['id'], number>);

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

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:changed',
      (payload) => {
        if (payload.protocolDappsBinding) {
          setProtocolDappsBinding(payload.protocolDappsBinding);
        }
      }
    );
  }, [fetchBindings, setProtocolDappsBinding]);

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
  const [dappBoundTabIdsOrig, setDappsBoundTabIds] = useAtom(
    dappsBoundTabIdsAtomic
  );

  const dappBoundTabIds = useMemo(() => {
    const fixed = { ...dappBoundTabIdsOrig };
    Object.keys(fixed).forEach((dappId) => {
      const checkoutedInfo = checkoutDappURL(dappId);
      if (checkoutedInfo.type === 'ipfs') {
        fixed[formatDappHttpOrigin(dappId)] = fixed[dappId];
        fixed[checkoutedInfo.dappID] = fixed[dappId];
      }
    });
    return fixed;
  }, [dappBoundTabIdsOrig]);

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
        console.log('dapps:changed', event.dapps);
        if (event.dapps) setDapps(event.dapps);
        if (event.pinnedList) setPinnedList(event.pinnedList);
        if (event.unpinnedList) setUnpinnedList(event.unpinnedList);
        if (event.dappBoundTabIds) setDappsBoundTabIds(event.dappBoundTabIds);
      }
    );
  }, [setDappsBoundTabIds, setPinnedList, setUnpinnedList, setDapps]);

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
    dappBoundTabIds,
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

export function useMatchDapp(origin?: string) {
  // 先根据 origin 匹配 Dapp，无匹配项后再用 domain 匹配一次
  const { dapps } = useDapps();
  const [dappInfo, setDappInfo] = useState<Partial<IMergedDapp> | null>(null);

  useEffect(() => {
    if (!origin) {
      setDappInfo(null);
      return;
    }

    const findExact = dapps.find(
      (item) => item.origin.toLowerCase() === origin.toLowerCase()
    );
    if (findExact) {
      setDappInfo(findExact);
    } else {
      const { secondaryOrigin } = canoicalizeDappUrl(origin);
      const findMatchDomain = dapps.find(
        (item) => item.origin === secondaryOrigin
      );
      if (findMatchDomain) {
        setDappInfo(findMatchDomain);
      } else {
        setDappInfo(null);
      }
    }
  }, [origin, dapps]);

  return dappInfo;
}

const createTabedDapps = (
  list: IMergedDapp[],
  dappBoundTabIds: IDappBoundTabIds,
  tabsGroupById: ReturnType<typeof useWindowTabs>['tabsGroupById']
): IDappWithTabInfo[] => {
  return list.map((item) => {
    return {
      ...item,
      tab: findTabByTabID(item, { dappBoundTabIds, tabsGroupById }),
    };
  });
};

export const useTabedDapps = () => {
  const { dapps, pinnedDapps, unpinnedDapps, dappBoundTabIds, ...rest } =
    useDapps();
  const { tabsGroupById } = useWindowTabs();

  return {
    ...rest,
    dapps: useMemo(
      () => createTabedDapps(dapps, dappBoundTabIds, tabsGroupById),
      [dapps, dappBoundTabIds, tabsGroupById]
    ),
    pinnedDapps: useMemo(
      () => createTabedDapps(pinnedDapps, dappBoundTabIds, tabsGroupById),
      [pinnedDapps, dappBoundTabIds, tabsGroupById]
    ),
    unpinnedDapps: useMemo(
      () => createTabedDapps(unpinnedDapps, dappBoundTabIds, tabsGroupById),
      [dappBoundTabIds, tabsGroupById, unpinnedDapps]
    ),
  };
};
