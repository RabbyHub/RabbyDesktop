/// <reference path="../../isomorphic/types.d.ts" />

import { sortDappsBasedPinned } from '@/isomorphic/dapp';
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
import { findTab } from '../utils/tab';
import useDebounceValue from './useDebounceValue';

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

export function useMatchDapp(origin?: string) {
  // 先根据 origin 匹配 Dapp，无匹配项后再用 domain 匹配一次
  const { dapps } = useDapps();
  const [dappInfo, setDappInfo] = useState<Partial<IMergedDapp> | null>(null);

  useEffect(() => {
    if (!origin) {
      setDappInfo(null);
      return;
    }

    const findExact = dapps.find((item) => item.origin === origin);
    if (findExact) {
      setDappInfo(findExact);
    } else {
      const { secondaryOrigin } = canoicalizeDappUrl(origin);
      const findMatchDomain = dapps.find(
        (item) => item.origin === secondaryOrigin
      );
      if (findMatchDomain) {
        setDappInfo(findMatchDomain);
      }
    }
  }, [origin, dapps]);

  return dappInfo;
}

const createTabedDapps = (
  list: IMergedDapp[],
  tabMapByOrigin: ReturnType<typeof useWindowTabs>['tabMapByOrigin'],
  tabMapBySecondaryMap: ReturnType<typeof useWindowTabs>['tabMapBySecondaryMap']
) => {
  return list.map((item) => {
    return {
      ...item,
      tab: findTab(item, { tabMapByOrigin, tabMapBySecondaryMap }),
    };
  });
};

export const useTabedDapps = () => {
  const { dapps, pinnedDapps, unpinnedDapps, ...rest } = useDapps();
  const { tabMapByOrigin, tabMapBySecondaryMap } = useWindowTabs();

  const [localSearchToken, setLocalSearchToken] = useState<string>('');
  const debouncedSearchToken = useDebounceValue(localSearchToken, 250);
  const filteredData = useMemo(() => {
    if (!debouncedSearchToken)
      return {
        dapps,
        pinnedDapps,
        unpinnedDapps,
      };

    const token = debouncedSearchToken.toLowerCase();
    const filterFn = (dapp: IDapp) => {
      return (
        dapp.alias?.toLowerCase().includes(token) ||
        dapp.origin?.toLowerCase().includes(token)
      );
    };

    return {
      dapps: dapps?.filter(filterFn),
      pinnedDapps: pinnedDapps?.filter(filterFn),
      unpinnedDapps: unpinnedDapps?.filter(filterFn),
    };
  }, [dapps, pinnedDapps, unpinnedDapps, debouncedSearchToken]);

  return {
    ...rest,
    localSearchToken,
    setLocalSearchToken,
    filteredData,
    dapps: useMemo(
      () => createTabedDapps(dapps, tabMapByOrigin, tabMapBySecondaryMap),
      [dapps, tabMapByOrigin, tabMapBySecondaryMap]
    ),
    pinnedDapps: useMemo(
      () => createTabedDapps(pinnedDapps, tabMapByOrigin, tabMapBySecondaryMap),
      [pinnedDapps, tabMapByOrigin, tabMapBySecondaryMap]
    ),
    unpinnedDapps: useMemo(
      () =>
        createTabedDapps(unpinnedDapps, tabMapByOrigin, tabMapBySecondaryMap),
      [tabMapByOrigin, tabMapBySecondaryMap, unpinnedDapps]
    ),
  };
};
