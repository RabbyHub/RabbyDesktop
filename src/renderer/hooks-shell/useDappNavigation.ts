import { useCallback, useEffect, useRef, useState } from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { useWindowTabs } from './useWindowTabs';

/**
 * @description check if tab's current url is considered as the entry of the dapp origin
 * For example:
 *
 * dapp origin: https://uniswap.org, possible **entry** tab urls:
 * - https://uniswap.org
 * - https://app.uniswap.org
 * - https://help.uniswap.org
 *
 * dapp origin: https://app.uniswap.org, possible **entry** tab urls:
 * - https://app.uniswap.org
 */
function isTabUrlEntryOfHttpDappOrigin(tabURL: string, httpDappOrigin: string) {
  const tabURLInfo = canoicalizeDappUrl(tabURL);
  const httpDappOriginInfo = canoicalizeDappUrl(httpDappOrigin);

  return (
    httpDappOriginInfo.origin === tabURLInfo.origin ||
    `https://www.${httpDappOriginInfo.fullDomain}` ===
      httpDappOriginInfo.fullDomain ||
    // dapp
    (httpDappOriginInfo.is2ndaryDomain &&
      httpDappOriginInfo.secondaryDomain === tabURLInfo.secondaryDomain)
  );
}

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
    onForceReloadButtonClick: useCallback(() => {
      if (!activeTab?.id) return;

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:reload-tab',
        activeTab?.id,
        true
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

export function useDetectDappVersion(shellNavInfo?: IShellNavInfo | null) {
  const [dappVersion, setDappVersion] = useState<{
    updated: boolean;
  }>({
    updated: false,
  });

  const dappOrigin = shellNavInfo?.dapp?.origin;
  const lastDappOrigin = useRef<string>(dappOrigin || '');

  useEffect(() => {
    if (dappOrigin) {
      // deduplicate
      if (lastDappOrigin.current !== dappOrigin) {
        window.rabbyDesktop.ipcRenderer.invoke(
          'detect-dapp-version',
          dappOrigin
        );
      }

      lastDappOrigin.current = dappOrigin;
    }

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:version-updated',
      (payload) => {
        if (payload.httpDappId !== dappOrigin) return;

        if (!dappOrigin || shellNavInfo?.dapp?.type !== 'http') {
          setDappVersion({ updated: false });
          return;
        }

        if (!isTabUrlEntryOfHttpDappOrigin(shellNavInfo?.tabUrl, dappOrigin))
          return;

        setDappVersion({ updated: !!payload.result?.updated });
      }
    );
  }, [dappOrigin, shellNavInfo]);

  const confirmDappVersion = useCallback(() => {
    if (!dappOrigin || shellNavInfo?.dapp?.type !== 'http') return;

    window.rabbyDesktop.ipcRenderer.invoke('confirm-dapp-updated', dappOrigin);
    setDappVersion({ updated: false });
  }, [dappOrigin, shellNavInfo]);

  return {
    dappVersion,
    confirmDappVersion,
  };
}
