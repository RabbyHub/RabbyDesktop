import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useDapps } from '../hooks/useDappsMngr';
import { toggleLoadingView } from '../ipcRequest/mainwin';
import { navigateToDappRoute } from '../utils/react-router';
import { findTab } from '../utils/tab';
import { useWindowTabs } from './useWindowTabs';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

export function useSidebarDapps() {
  const { tabMapByOrigin, tabMapBySecondaryMap, activeTab } = useWindowTabs();
  const { dapps: allDapps, pinnedDapps, unpinnedDapps } = useDapps();

  const dappsInSidebar = useMemo(() => {
    const unpinnedOpenedDapps: IDappWithTabInfo[] = [];
    unpinnedDapps.forEach((dapp) => {
      const tab = findTab(dapp, { tabMapByOrigin, tabMapBySecondaryMap });

      if (tab) {
        unpinnedOpenedDapps.push({
          ...dapp,
          tab,
        });
      }
    });

    return {
      pinnedDapps: pinnedDapps.map((dapp) => {
        const tab = findTab(dapp, { tabMapByOrigin, tabMapBySecondaryMap });

        return {
          ...dapp,
          tab,
        };
      }),
      unpinnedOpenedDapps,
    };
  }, [pinnedDapps, unpinnedDapps, tabMapByOrigin, tabMapBySecondaryMap]);

  const dappActions = {
    onSelectDapp: useCallback(async (tab: chrome.tabs.Tab) => {
      await chrome.tabs.update(tab.id!, { active: true });
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

        window.rabbyDesktop.ipcRenderer.invoke(
          'safe-open-dapp-tab',
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
      '__internal_forward:main-window:create-dapp-tab',
      (targetURL) => {
        const dappOrigin = canoicalizeDappUrl(targetURL).origin;
        chrome.tabs.create({ url: targetURL, active: true });

        navigateToDappRoute(router.navigate, dappOrigin);
      }
    );
  }, [router.navigate]);
}

const latestDappScreenshotAtom = atom<string | null>(null);
export function useLatestDappScreenshot() {
  const [latestDappScreenshot, setLatestDappScreenshot] = useAtom(
    latestDappScreenshotAtom
  );

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:got-dapp-screenshot',
      (payload) => {
        if (latestDappScreenshot) {
          URL.revokeObjectURL(latestDappScreenshot);
        }

        if (payload.imageBuf) {
          const url = URL.createObjectURL(
            new Blob([payload.imageBuf], {
              type: 'image/png',
            })
          );
          setLatestDappScreenshot(url);
        } else {
          setLatestDappScreenshot(null);
        }
      }
    );
  }, [latestDappScreenshot, setLatestDappScreenshot]);

  return latestDappScreenshot;
}
