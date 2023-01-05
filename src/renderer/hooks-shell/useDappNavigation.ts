import { useCallback, useEffect, useState } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { getNavInfoByTabId, toggleLoadingView } from '../ipcRequest/mainwin';
import { useWindowTabs } from './useWindowTabs';
import { useDapps } from '../hooks/useDappsMngr';

export function useDappNavigation() {
  const { activeTab } = useWindowTabs();
  const { dapps: allDapps } = useDapps();

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
      const dappOrigin = canoicalizeDappUrl(activeTab?.url || '')?.origin;
      const foundDapp = !dappOrigin
        ? null
        : allDapps.find((dapp) => {
            return dapp.origin === dappOrigin;
          });

      if (activeTab && foundDapp) {
        toggleLoadingView({
          type: 'start',
          tabId: activeTab.id,
          dapp: foundDapp,
        });
      }

      chrome.tabs.reload();
    }, [activeTab, allDapps]),
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
