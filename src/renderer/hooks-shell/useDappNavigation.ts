import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { isTabUrlEntryOfHttpDappOrigin } from '@/isomorphic/dapp';
import { useWindowTabs } from './useWindowTabs';
import { useGhostTooltip } from '../routes-popup/TopGhostWindow/useGhostWindow';

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

  const confirmDappVersion = useCallback(() => {
    if (!dappOrigin || shellNavInfo?.dapp?.type !== 'http') return;

    window.rabbyDesktop.ipcRenderer.invoke('confirm-dapp-updated', dappOrigin);
    setDappVersion({ updated: false });
  }, [dappOrigin, shellNavInfo]);

  useEffect(() => {
    if (dappOrigin) {
      if (lastDappOrigin.current !== dappOrigin) {
        setDappVersion({ updated: false });
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
  }, [dappOrigin, shellNavInfo, confirmDappVersion]);

  return {
    dappVersion,
    confirmDappVersion,
  };
}
