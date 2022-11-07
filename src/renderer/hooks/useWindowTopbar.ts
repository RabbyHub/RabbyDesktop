/* eslint-disable no-underscore-dangle, @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/alt-text */
/// <reference types="chrome" />
/// <reference path="../preload.d.ts" />

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getAllDapps } from 'renderer/ipcRequest/dapps';
import { CHAINS_LIST } from '@debank/common';

import { canoicalizeDappUrl } from '../../isomorphic/url';

import { useWindowState } from './useWindowState';

export function useWinTriples() {
  const {
    osType,
    winState,
    onMinimizeButton,
    onMaximizeButton,
    onFullscreenButton,
    onCloseButton,
  } = useWindowState();

  const winButtonActions = {
    onCreateTabButtonClick: useCallback(
      () => chrome.tabs.create(undefined as any),
      []
    ),
    onGoBackButtonClick: useCallback(() => chrome.tabs.goBack(), []),
    onGoForwardButtonClick: useCallback(() => chrome.tabs.goForward(), []),
    onReloadButtonClick: useCallback(() => chrome.tabs.reload(), []),
    onMinimizeButton,
    onMaximizeButton,
    onCloseButton,
    onFullscreenButton,
  };

  return {
    winOSType: osType,
    winState,
    winButtonActions,
  };
}

export function useConnectedSite() {
  const [connectedSiteMap, setConnectedSiteMap] = useState<
    Record<string, IConnectedSite & { chainName: string }>
  >({});

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal__rabby:connect',
      (data) => {
        setConnectedSiteMap((prev) => ({
          ...prev,
          [data.origin]: {
            ...data,
            chainName:
              CHAINS_LIST.find(
                (item) => item.hex.toLowerCase() === data.chainId.toLowerCase()
              )?.name || '',
          },
        }));
      }
    );
    return () => {
      dispose?.();
    };
  }, []);

  return {
    connectedSiteMap,
    setConnectedSiteMap,
  };
}

export type ChromeTab = chrome.tabs.Tab;
export type ChromeTabWithLocalFavicon = ChromeTab & {
  localFavIconUrl?: string;
};
export type TabId = ChromeTab['id'];

export function useTopbarTabs() {
  const [origTabList, setTabList] = useState<ChromeTabWithLocalFavicon[]>([]);
  const [activeTabId, setActiveId] = useState<ChromeTab['id']>(-1);
  const [windowId, setWindowId] = useState<number | undefined>(undefined);

  const { tabList, activeTab } = useMemo(() => {
    let activeTab = null as ChromeTabWithLocalFavicon | null;
    const tabList: ChromeTabWithLocalFavicon[] = origTabList.map((_tab) => {
      const tab = { ..._tab };
      if (tab.id === activeTabId) {
        tab.active = true;
        activeTab = tab;
      } else {
        tab.active = false;
      }
      return tab;
    });

    return { tabList, activeTab };
  }, [origTabList, activeTabId]);

  const updateActiveTab = useCallback(
    (activeTab: ChromeTab | chrome.tabs.TabActiveInfo) => {
      const activeTabId =
        (activeTab as ChromeTab).id ||
        (activeTab as chrome.tabs.TabActiveInfo).tabId;

      setWindowId(activeTab.windowId);
      setActiveId(activeTabId);
    },
    []
  );

  const fetchingRef = useRef(false);
  const fetchTabListState = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    const [tabs, dapps] = await Promise.all([
      new Promise<ChromeTab[]>((resolve) =>
        // we can also use queryInfo { windowId: chrome.windows.WINDOW_ID_CURRENT } here
        chrome.tabs.query({ currentWindow: true }, resolve)
      ),
      // array to object group by origin
      getAllDapps().then((dapps) =>
        dapps.reduce((acc, dapp) => {
          acc[dapp.origin] = dapp;
          return acc;
        }, {} as Record<IDapp['origin'], IDapp>)
      ),
    ]).finally(() => {
      fetchingRef.current = false;
    });
    const origTabList = tabs.map((tab) => {
      const origin = tab.url ? canoicalizeDappUrl(tab.url).origin : '';
      return {
        ...tab,
        ...(origin &&
          dapps[origin] && { localFavIconUrl: dapps[origin].faviconBase64 }),
      };
    });

    setTabList(origTabList);

    const activeTab = origTabList.find((tab) => tab.active);
    if (activeTab) {
      updateActiveTab(activeTab);
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

  const tabListDomRef = useRef<HTMLUListElement>(null);

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
        if (!matched) ret.push({ id: tabCreation.id, ...tabCreation });

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
    > = (tabId: TabId) => {
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

  const tabActions = {
    onTabClick: useCallback((tab: ChromeTab) => {
      chrome.tabs.update(tab.id!, { active: true });
    }, []),
    onTabClose: useCallback((tab: ChromeTab) => {
      if (tab.id) {
        chrome.tabs.remove(tab.id);
      }
    }, []),
  };

  return {
    tabListDomRef,
    tabList,
    activeTab,
    tabActions,
  };
}

export function useSelectedTabInfo(activeTab?: ChromeTab | null) {
  const [selectedTabInfo, setSelectedTabInfo] =
    useState<ChannelMessagePayload['webui-ext-navinfo']['response'][0]>();
  useEffect(() => {
    if (!activeTab?.id) return;
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'webui-ext-navinfo',
      (payload) => {
        setSelectedTabInfo(payload);
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage(
      'webui-ext-navinfo',
      activeTab.id
    );

    return () => dispose?.();
  }, [activeTab?.id, activeTab?.url]);

  return selectedTabInfo;
}
