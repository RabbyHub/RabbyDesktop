/// <reference path="../../isomorphic/types.d.ts" />

import {
  checkoutDappURL,
  formatDappHttpOrigin,
  isOpenedAsHttpDappType,
  matchDappsByOrigin,
  sortDappsBasedPinned,
} from '@/isomorphic/dapp';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowTabs } from '../hooks-shell/useWindowTabs';
import {
  detectDapps,
  fetchDapps,
  fetchProtocolDappsBinding,
  getDapp,
  putProtocolDappsBinding,
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

/**
 * @description by default, it will NOT fetch dapps from main process,
 * you should specify `fetchByDefault` to `true` if you want to fetch dapps
 */
export function useDapps(options?: { fetchByDefault?: boolean }) {
  const [originDapps, setDapps] = useAtom(dappsAtomic);
  const [pinnedList, setPinnedList] = useAtom(pinnedListAtomic);
  const [unpinnedList, setUnpinnedList] = useAtom(unpinnedListAtomic);
  const [dappBoundTabIdsOrig, setDappsBoundTabIds] = useAtom(
    dappsBoundTabIdsAtomic
  );

  const dappBoundTabIds = useMemo(() => {
    const fixed = { ...dappBoundTabIdsOrig };
    Object.keys(fixed).forEach((dappId) => {
      const checkedOutDappURLInfo = checkoutDappURL(dappId);
      if (isOpenedAsHttpDappType(checkedOutDappURLInfo.type)) {
        fixed[formatDappHttpOrigin(dappId)] = fixed[dappId];
        fixed[checkedOutDappURLInfo.dappID] = fixed[dappId];
      }
    });
    return fixed;
  }, [dappBoundTabIdsOrig]);

  // only fetch dapps once for every call to hooks
  const calledRef = useRef(!options?.fetchByDefault);
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
        if (event.dappBoundTabIds) setDappsBoundTabIds(event.dappBoundTabIds);
      }
    );
  }, [setDappsBoundTabIds, setPinnedList, setUnpinnedList, setDapps]);

  const renameDapp = useCallback(async (dapp: IDappPartial, alias: string) => {
    window.rabbyDesktop.ipcRenderer.invoke('dapps-put', { ...dapp, alias });
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
    mutatePinnedList: setPinnedList,
    mutateUnpinnedList: setUnpinnedList,
  };
}

export function useDapp(dappID?: string) {
  const [dappInfo, setDappInfo] = useState<Partial<IMergedDapp> | null>(null);

  useEffect(() => {
    if (!dappID) {
      setDappInfo(null);
      return;
    }

    getDapp(dappID).then((newVal) => {
      setDappInfo(newVal);
    });
  }, [dappID]);

  return dappInfo;
}

export function useMatchDappByOrigin(origin?: string) {
  const { dapps } = useDapps();

  const dappInfo = useMemo(() => {
    if (!origin) return null;

    const dappInfoToMatch = checkoutDappURL(origin);

    if (dappInfoToMatch.type !== 'http') {
      const matchedDapp = matchDappsByOrigin(dappInfoToMatch, dapps);

      return matchedDapp;
    }

    // 对 http 类型的 dapp，先根据 origin 匹配 Dapp，无匹配项后再用 domain 匹配一次
    const findExact = dapps.find(
      (item) => item.origin.toLowerCase() === origin.toLowerCase()
    );
    if (findExact) {
      return findExact;
    }

    const { secondaryOrigin } = canoicalizeDappUrl(origin);
    const findMatchDomain = dapps.find(
      (item) => item.origin === secondaryOrigin
    );

    return findMatchDomain || null;
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
