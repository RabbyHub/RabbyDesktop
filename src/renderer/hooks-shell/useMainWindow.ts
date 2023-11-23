import { canoicalizeDappUrl } from '@/isomorphic/url';
import { atom, useAtom, useAtomValue } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { useDapps } from '../hooks/useDappsMngr';
import { matomoRequestEvent } from '../utils/matomo-request';
import { navigateToDappRoute } from '../utils/react-router';
import { findTabByTabID } from '../utils/tab';
import { useWindowTabs } from './useWindowTabs';
import { coerceInteger } from '../utils/number';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

export function useSidebarDapps() {
  const { tabsGroupById, activeTab } = useWindowTabs();
  const {
    dapps: allDapps,
    pinnedDapps,
    unpinnedDapps,
    dappBoundTabIds,
  } = useDapps({ fetchByDefault: true });

  const dappsInSidebar = useMemo(() => {
    const unpinnedOpenedDapps: IDappWithTabInfo[] = [];
    unpinnedDapps.forEach((dapp) => {
      const tab = findTabByTabID(dapp, { tabsGroupById, dappBoundTabIds });

      if (tab) {
        unpinnedOpenedDapps.push({
          ...dapp,
          tab,
        });
      }
    });

    return {
      pinnedDapps: pinnedDapps.map((dapp) => {
        const tab = findTabByTabID(dapp, { tabsGroupById, dappBoundTabIds });

        return {
          ...dapp,
          tab,
        };
      }),
      unpinnedOpenedDapps,
    };
  }, [pinnedDapps, unpinnedDapps, tabsGroupById, dappBoundTabIds]);

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
      async (dappOrigin: string) => {
        const foundDapp = !dappOrigin
          ? null
          : allDapps.find((dapp) => {
              return dapp.origin === dappOrigin;
            });

        return window.rabbyDesktop.ipcRenderer
          .invoke('safe-open-dapp-tab', dappOrigin)
          .then((res) => {
            if (res.shouldNavTabOnClient) {
              if (activeTab && foundDapp) {
                window.rabbyDesktop.ipcRenderer.sendMessage(
                  '__internal_rpc:mainwindow:toggle-loading-view',
                  {
                    type: 'show',
                    tabId: activeTab.id!,
                    tabURL: dappOrigin,
                  }
                );
              }
            }
            if (res.openType === 'create-tab') {
              matomoRequestEvent({
                category: 'My Dapp',
                action: 'Visit Dapp',
                label: dappOrigin,
              });
            }

            return res;
          });
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
      '__internal_forward:main-window:close-all-tab',
      async () => {
        const tabs = await chrome.tabs.query({});
        await chrome.tabs.remove(tabs.map((tab) => tab.id!));
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

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:opened-dapp-tab',
      (payload) => {
        const dappOrigin = canoicalizeDappUrl(payload.dappOrigin).origin;

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

const floatingCurrentAccountCompWidthAtom = atom<number>(0);
export function useFloatingCurrentAccountCompWidth() {
  const width = useAtomValue(floatingCurrentAccountCompWidthAtom);

  return {
    fixedFloatingCurrentAccountCompWidth: Math.min(width, 362),
  };
}
export function useGetFloatingCurrentAccountCompWidth(isFloating?: boolean) {
  const [width, setWidth] = useAtom(floatingCurrentAccountCompWidthAtom);

  const divRef = useRef<HTMLDivElement>(null);

  const obsRef = useRef<ResizeObserver>(
    new ResizeObserver(() => {
      const divEl = divRef.current!;
      const rect = divEl.getBoundingClientRect();

      setWidth(coerceInteger(rect.width, 0));
    })
  );

  useLayoutEffect(() => {
    const divEl = divRef.current;
    const obs = obsRef.current!;

    if (!divEl) {
      setWidth(0);
    } else if (isFloating) {
      const rect = divEl.getBoundingClientRect();
      setWidth(coerceInteger(rect.width, 0));

      obs.observe(divEl);
    }

    return () => {
      if (divEl) {
        obs.unobserve(divEl);
      }
    };
  }, [isFloating, setWidth]);

  return {
    divRef,
    floatingCurrentAccountCompWidth: width,
  };
}
