import { useCallback, useEffect, useMemo } from 'react';
import { useDapps } from '../hooks/useDappsMngr';
import { toggleLoadingView } from '../ipcRequest/mainwin';
import { navigateToDappRoute } from '../utils/react-router';
import { useWindowTabs } from './useWindowTabs';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

export function hideAllTabs(windowId: number | undefined) {
  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_rpc:mainwindow:hide-all-tabs',
    windowId!
  );
}

export function useSidebarDapps() {
  const { tabMap, activeTab } = useWindowTabs();
  const { dapps: allDapps, pinnedDapps, unpinnedDapps } = useDapps();

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
    onSelectDapp: useCallback((tab: chrome.tabs.Tab) => {
      chrome.tabs.update(tab.id!, { active: true });
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:select-tab',
        tab.windowId,
        tab.id!
      );
    }, []),
    onOpenDapp: useCallback(
      (dappOrigin: string) => {
        const foundDapp = !dappOrigin
          ? null
          : allDapps.find((dapp) => {
              return dapp.origin === dappOrigin;
            });

        if (activeTab && foundDapp) {
          toggleLoadingView({
            type: 'show',
            tabId: activeTab.id!,
            tabURL: dappOrigin,
          });
        }

        window.rabbyDesktop.ipcRenderer.sendMessage(
          '__internal_rpc:mainwindow:open-tab',
          dappOrigin
        );
      },
      [activeTab, allDapps]
    ),
  };

  return {
    allDapps,
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
      async (tabId) => {
        await chrome.tabs.remove(tabId);
      }
    );
  }, [router]);

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
