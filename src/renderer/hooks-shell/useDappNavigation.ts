import { useCallback, useEffect, useState } from 'react';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { getNavInfoByTabId } from '../ipcRequest/mainwin';

export function useDappNavigation() {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    if (!IS_RUNTIME_PRODUCTION) {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        setActiveTab(tabs[0] || null);
      });
    }
  }, []);

  useEffect(() => {
    const fetchActiveTab = () => {
      chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        setActiveTab(tabs[0] || null);
      });
    };
    const onCreated: GetListenerFirstParams<
      typeof chrome.tabs.onCreated.addListener
    > = (tabCreation) => {
      if (tabCreation.status !== 'complete') return;
      if (!tabCreation.active) return;

      fetchActiveTab();
    };

    const onRemoved: GetListenerFirstParams<
      typeof chrome.tabs.onRemoved.addListener
    > = (tabId, removeInfo) => {
      if (activeTab && removeInfo.windowId !== activeTab?.windowId) return;
      if (activeTab && tabId === activeTab?.id) return;

      fetchActiveTab();
    };

    const onActivated: GetListenerFirstParams<
      typeof chrome.tabs.onActivated.addListener
    > = (activeInfo) => {
      fetchActiveTab();
    };

    const onUpdated: GetListenerFirstParams<
      typeof chrome.tabs.onUpdated.addListener
    > = (tabId, changeInfo, tab) => {
      if (activeTab && tab.windowId !== activeTab?.windowId) return;
      if (activeTab && tabId !== activeTab?.id) return;

      fetchActiveTab();
    };

    chrome.tabs.onCreated.addListener(onCreated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      chrome.tabs.onCreated.removeListener(onCreated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [activeTab]);

  const [selectedTabInfo, setSelectedTabInfo] = useState<IShellNavInfo>();

  useEffect(() => {
    if (!activeTab?.id) return;

    getNavInfoByTabId(activeTab.id).then((res) => {
      setSelectedTabInfo(res);
    });
  }, [activeTab?.id, activeTab?.url]);

  const navActions = {
    onCreateTabButtonClick: useCallback(
      () => chrome.tabs.create(undefined as any),
      []
    ),
    onGoBackButtonClick: useCallback(() => chrome.tabs.goBack(), []),
    onGoForwardButtonClick: useCallback(() => chrome.tabs.goForward(), []),
    onReloadButtonClick: useCallback(() => chrome.tabs.reload(), []),
  };

  return {
    tabOrigin: activeTab?.url
      ? canoicalizeDappUrl(activeTab.url)?.origin || ''
      : '',
    activeTab,
    navActions,
    selectedTabInfo,
  };
}
