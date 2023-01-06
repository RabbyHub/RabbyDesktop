import { useCallback, useEffect, useState } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { getNavInfoByTabId } from '../ipcRequest/mainwin';
import { useWindowTabs } from './useWindowTabs';

export function useDappNavigation() {
  const { activeTab } = useWindowTabs();

  const [selectedTabInfo, setSelectedTabInfo] = useState<IShellNavInfo>();

  useEffect(() => {
    if (!activeTab?.id) return;

    getNavInfoByTabId(activeTab.id).then((res) => {
      setSelectedTabInfo(res);
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
