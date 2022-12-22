import { canoicalizeDappUrl } from '@/isomorphic/url';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDapps } from '../hooks/useDappsMngr';
import { fetchDapps } from '../ipcRequest/dapps';
import { navigateToDappRoute } from '../utils/react-router';

type ChromeTabWithOrigin = chrome.tabs.Tab & {
  dappOrigin: string;
};

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

export function hideAllTabs(
  windowId: number | undefined,
  activeTabId?: chrome.tabs.Tab['id']
) {
  if (activeTabId) {
    chrome.tabs.update(activeTabId!, { active: false });
  }
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_webui-hideAllTabs',
    windowId!
  );
}

export function useSidebarDapps() {
  const { pinnedDapps, unpinnedDapps } = useDapps();

  const [origTabList, setTabList] = useState<ChromeTabWithOrigin[]>([]);
  const [activeTabId, setActiveId] = useState<chrome.tabs.Tab['id']>(-1);
  const [windowId, setWindowId] = useState<number | undefined>(undefined);

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

  const updateActiveTab = useCallback(
    (tab: chrome.tabs.Tab | chrome.tabs.TabActiveInfo) => {
      const tabId =
        (tab as chrome.tabs.Tab).id || (tab as chrome.tabs.TabActiveInfo).tabId;

      setWindowId(tab.windowId);
      setActiveId(tabId);
    },
    []
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
  }, [updateActiveTab]);

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
    if (!chrome.tabs.onCreated) {
      throw new Error(
        `chrome global not setup. Did the extension preload not get run?`
      );
    }

    const onCreated: GetListenerFirstParams<
      typeof chrome.tabs.onCreated.addListener
    > = (tabCreation) => {
      if (tabCreation.windowId !== windowId) return;

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
      setTabList((prev) =>
        prev.map((tab) => {
          return tab.id === tabId ? { ...tab, ...details } : tab;
        })
      );
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
  }, [origTabList, windowId]);

  useEffect(() => {
    const onActived: GetListenerFirstParams<
      typeof chrome.tabs.onActivated.addListener
    > = (activeInfo) => {
      if (activeInfo.windowId !== windowId) return;

      updateActiveTab(activeInfo);
    };

    chrome.tabs.onActivated.addListener(onActived);
    return () => {
      chrome.tabs.onActivated.removeListener(onActived);
    };
  }, [updateActiveTab, windowId]);

  const dappsInSidebar = useMemo(() => {
    const unpinnedOpenedDapps: IDappWithTabInfo[] = [];
    unpinnedDapps.forEach((dapp) => {
      const tab = tabMap.get(dapp.origin);
      if (tab) {
        unpinnedOpenedDapps.push({
          ...dapp,
          tab,
        });
      }
    });

    return {
      pinnedDapps: pinnedDapps.map((dapp) => {
        return {
          ...dapp,
          tab: tabMap.get(dapp.origin),
        };
      }),
      unpinnedOpenedDapps,
    };
  }, [pinnedDapps, unpinnedDapps, tabMap]);

  const dappActions = {
    onTabClick: useCallback((tab: chrome.tabs.Tab) => {
      chrome.tabs.update(tab.id!, { active: true });
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_webui-selectTab',
        tab.windowId,
        tab.id!
      );
    }, []),
    onTabClose: useCallback((tab: chrome.tabs.Tab) => {
      if (tab.id) {
        chrome.tabs.remove(tab.id);
      }
    }, []),
    onHideAllTab: useCallback(() => {
      const activeTid = activeTabId || activeTab?.id;
      if (!activeTid) {
        console.warn('[onHideAllTab] no active tab');
        return;
      }
      hideAllTabs(activeTid, windowId);
    }, [activeTabId, activeTab, windowId]),
  };

  return {
    pinnedDapps: dappsInSidebar.pinnedDapps,
    unpinnedOpenedDapps: dappsInSidebar.unpinnedOpenedDapps,
    activeTab,
    dappActions,
  };
}

/**
 * @warning only use this hooks once in whole app, and only use it in main window's shell
 */
export function useForwardFromInternalPage(
  router: ReturnType<typeof import('react-router-dom').createMemoryRouter>
) {
  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:main-window:close-tab',
      (tabId) => {
        chrome.tabs.remove(tabId);
      }
    );
  }, []);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:main-window:open-dapp',
      (dappOrigin) => {
        chrome.tabs.create({ url: dappOrigin, active: true });

        navigateToDappRoute(router.navigate, dappOrigin);
      }
    );
  }, [router.navigate]);
}
