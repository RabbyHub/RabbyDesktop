import { useCallback, useEffect, useState } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { useWindowTabs } from './useWindowTabs';

export function useDappNavigation() {
  const { activeTab } = useWindowTabs();

  const [selectedTabInfo, setSelectedTabInfo] = useState<IShellNavInfo>();

  useEffect(() => {
    if (!activeTab?.id) return;

    window.rabbyDesktop.ipcRenderer
      .invoke('get-webui-ext-navinfo', activeTab.id)
      .then((res) => {
        setSelectedTabInfo(res.tabNavInfo);
      });
  }, [activeTab?.id, activeTab?.url]);

  const navActions = {
    onGoBackButtonClick: useCallback(() => chrome.tabs.goBack(), []),
    onGoForwardButtonClick: useCallback(() => chrome.tabs.goForward(), []),
    onReloadButtonClick: useCallback(() => {
      if (!activeTab?.id) return;

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:reload-tab',
        activeTab?.id
      );
    }, [activeTab]),
    onStopLoadingButtonClick: useCallback(() => {
      if (!activeTab?.id) return;
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:stop-tab-loading',
        activeTab?.id
      );
    }, [activeTab?.id]),
    onHomeButtonClick: useCallback(() => {
      if (!selectedTabInfo?.dapp?.origin) {
        return;
      }
      window.rabbyDesktop.ipcRenderer.invoke(
        'safe-open-dapp-tab',
        selectedTabInfo?.dapp?.origin,
        {
          dontReloadOnSwitchToActiveTab: false,
        }
      );
    }, [selectedTabInfo?.dapp?.origin]),
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
