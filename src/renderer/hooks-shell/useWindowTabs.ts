import { simpleDiff } from '@/isomorphic/json';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { fetchDapps } from '../ipcRequest/dapps';

type ChromeTabWithOrigin = chrome.tabs.Tab & {
  dappOrigin: string;
};

const tabListAtom = atom<ChromeTabWithOrigin[]>([]);
const activeTabIdAtom = atom<chrome.tabs.Tab['id']>(-1);
const activeWindowIdAtom = atom<number | undefined>(undefined);

export function useWindowTabs() {
  const [origTabList, setTabList] = useAtom(tabListAtom);
  const [activeTabId, setActiveId] = useAtom(activeTabIdAtom);
  const [activeWindowId, setActiveWindowId] = useAtom(activeWindowIdAtom);

  const updateActiveTab = useCallback(
    (tab: chrome.tabs.Tab | chrome.tabs.TabActiveInfo) => {
      const tabId =
        (tab as chrome.tabs.Tab).id || (tab as chrome.tabs.TabActiveInfo).tabId;

      setActiveWindowId(tab.windowId);
      setActiveId(tabId);
    },
    [setActiveWindowId, setActiveId]
  );

  const fetchingRef = useRef(false);
  const fetchTabListState = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    const [tabs, dapps] = await Promise.all([
      new Promise<chrome.tabs.Tab[]>((resolve) =>
        // we can also use queryInfo { windowId: chrome.windows.WINDOW_ID_CURRENT } here
        chrome.tabs.query({ currentWindow: true }, resolve)
      ),
      // array to object group by origin
      fetchDapps().then(({ dapps: _dapps }) =>
        _dapps.reduce((acc, dapp) => {
          acc[dapp.origin] = dapp;
          return acc;
        }, {} as Record<IDapp['origin'], IDapp>)
      ),
    ]).finally(() => {
      fetchingRef.current = false;
    });

    const tabList = tabs.map((tab) => {
      const origin = tab.url ? canoicalizeDappUrl(tab.url).origin : '';
      return {
        ...tab,
        dappOrigin: origin,
        ...(origin &&
          dapps[origin] && {
            localFavIconUrl: dapps[origin].faviconBase64,
            dappAlias: dapps[origin].alias,
          }),
      };
    });

    setTabList(tabList);

    const aTab = tabList.find((tab) => tab.active);
    if (aTab) {
      updateActiveTab(aTab);
    }
  }, [setTabList, updateActiveTab]);

  /* eslint-disable @typescript-eslint/no-shadow */
  const { tabMap, activeTab } = useMemo(() => {
    let activeTab = null as ChromeTabWithOrigin | null;
    const tabMap: Map<ChromeTabWithOrigin['dappOrigin'], ChromeTabWithOrigin> =
      new Map();
    origTabList.forEach((_tab) => {
      const tab = { ..._tab };
      if (tab.id === activeTabId) {
        tab.active = true;
        activeTab = tab;
      } else {
        tab.active = false;
      }

      tabMap.set(tab.dappOrigin, tab);

      return tab;
    });

    return { tabMap, activeTab };
  }, [origTabList, activeTabId]);
  /* eslint-enable @typescript-eslint/no-shadow */

  return {
    tabMap,
    activeTab,
    setTabList,
    fetchTabListState,
    updateActiveTab,
    activeWindowId,
  };
}

/**
 * @description make sure ONLY call this hook in the top level of whole page-level app
 */
export function useChromeTabsEvents() {
  const { fetchTabListState, updateActiveTab, activeWindowId, setTabList } =
    useWindowTabs();

  useEffect(() => {
    fetchTabListState();

    const onUpdate: Parameters<typeof chrome.tabs.onUpdated.addListener>[0] = (
      _,
      changeInfo
    ) => {
      if (changeInfo.status === 'complete' || !changeInfo.favIconUrl) {
        fetchTabListState();
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdate);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdate);
    };
  }, [fetchTabListState]);

  useEffect(() => {
    const onActived: GetListenerFirstParams<
      typeof chrome.tabs.onActivated.addListener
    > = (activeInfo) => {
      if (activeInfo.windowId !== activeWindowId) return;

      updateActiveTab(activeInfo);
    };

    chrome.tabs.onActivated.addListener(onActived);
    return () => {
      chrome.tabs.onActivated.removeListener(onActived);
    };
  }, [updateActiveTab, activeWindowId]);

  useEffect(() => {
    if (!chrome.tabs.onCreated) {
      throw new Error(
        `chrome global not setup. Did the extension preload not get run?`
      );
    }

    const onCreated: GetListenerFirstParams<
      typeof chrome.tabs.onCreated.addListener
    > = (tabCreation) => {
      if (tabCreation.windowId !== activeWindowId) return;

      setTabList((prev) => {
        let matched = false;
        const ret = prev.map((tab) => {
          if (tab.id === tabCreation.id) {
            matched = true;
            return { id: tabCreation.id, ...tab, ...tabCreation };
          }
          return tab;
        });
        if (!matched)
          ret.push({
            id: tabCreation.id,
            dappOrigin: canoicalizeDappUrl(tabCreation.url || '').origin,
            ...tabCreation,
          });

        return ret;
      });
    };

    const onUpdated: GetListenerFirstParams<
      typeof chrome.tabs.onUpdated.addListener
    > = (tabId, _, details) => {
      setTabList((prev) => {
        const tabIdx = prev.findIndex((tab) => tab.id === tabId);
        if (tabIdx === -1) return prev;

        const tab = prev[tabIdx];

        const newDetails = { ...tab, ...details };
        const changed = simpleDiff(tab, newDetails);
        if (!changed) return prev;

        prev[tabIdx] = newDetails;

        return [...prev];
      });
    };

    const onRemoved: GetListenerFirstParams<
      typeof chrome.tabs.onRemoved.addListener
    > = (tabId: chrome.tabs.Tab['id']) => {
      setTabList((prev) => {
        const tabIndex = prev.findIndex((tab) => tab.id === tabId);
        if (tabIndex > -1) {
          prev.splice(tabIndex, 1);
          return [...prev];
        }
        return prev;
      });
    };
    chrome.tabs.onCreated.addListener(onCreated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    return () => {
      chrome.tabs.onCreated.removeListener(onCreated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };
  }, [setTabList, activeWindowId]);
}
