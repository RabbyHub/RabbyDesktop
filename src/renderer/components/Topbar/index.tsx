/* eslint-disable no-underscore-dangle, @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/alt-text */
/// <reference types="chrome" />
/// <reference path="../../preload.d.ts" />

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import classnames from 'classnames';

import {
  IconTabCloseHover,
  IconTabClose,
  IconNavGoback,
  IconNavGoforward,
  IconNavRefresh,
} from '../../../../assets/icons/native-tabs';

import {
  IconWin32TripleClose,
  IconWin32TripleMaxmize,
  IconWin32TripleRecover,
  IconWin32TripleMinimize,
  IconDarwinTripleClose,
  IconDarwinTripleMinimize,
  IconDarwinTripleFullscreen,
  IconDarwinTripleHoverClose,
  IconDarwinTripleHoverMinimize,
  IconDarwinTripleHoverFullscreen,
  IconDarwinTripleHoverRecover,
} from '../../../../assets/icons/native-tabs-triples';

import './index.less';
import { canoicalizeDappUrl, isInternalProtocol, isMainWinShellWebUI, parseQueryString } from '../../../isomorphic/url';

import { useWindowState } from '../../hooks/useWindowState';
import { IS_RUNTIME_PRODUCTION, RABBY_HOMEPAGE_URL, } from '../../../isomorphic/constants';
import { CHAINS, CHAINS_LIST } from '@debank/common';
import { getAllDapps } from 'renderer/ipcRequest/dapps';
import DappAddressBar from './DappAddressBar';
import { hideDappAddressbarSecurityPopupView } from 'renderer/ipcRequest/security-addressbarpopup';

const isDebug = process.env.NODE_ENV !== 'production';

type ChromeTab = chrome.tabs.Tab;
type ChromeTabWithLocalFavicon = ChromeTab & { localFavIconUrl?: string };
type TabId = ChromeTab['id'];
// type ChromeTabLike = { id?: ChromeTab["id"] };

type CustomElement<T> = Partial<T & React.DOMAttributes<T> & { children: any }>;

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      ['browser-action-list']: CustomElement<{ id: string }>;
    }
  }
}

const WITH_NAV_BAR = parseQueryString().__withNavigationbar === 'true';
const CLOSABLE = parseQueryString().__webuiClosable === 'true';

function filterFavIcon(url?: string, isActiveTab = false) {
  // homepage
  if (url?.startsWith(RABBY_HOMEPAGE_URL)) {
    return isActiveTab
      ? 'rabby-internal://assets/icons/internal-homepage/icon-home.svg'
      : 'rabby-internal://assets/icons/internal-homepage/icon-home-blur.svg';
  }

  return null;
}

function filterClosable(url?: string, isClosable = CLOSABLE) {
  // home page
  if (url?.includes(RABBY_HOMEPAGE_URL)) {
    return false;
  }

  return isClosable;
}

function useWinTriples() {
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

function useConnectedSite() {
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

function useTopbar() {
  const [origTabList, setTabList] = useState<(ChromeTabWithLocalFavicon)[]>([]);
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
  const fetchTabListState = useCallback(
    async () => {
      if (fetchingRef.current) return ;

      fetchingRef.current = true;
      const [tabs, dapps] = await Promise.all([
        new Promise<ChromeTab[]>((resolve) =>
          // we can also use queryInfo { windowId: chrome.windows.WINDOW_ID_CURRENT } here
          chrome.tabs.query({ currentWindow: true }, resolve)
        ),
        // array to object group by origin
        getAllDapps().then(dapps =>
          dapps.reduce((acc, dapp) => {
            acc[dapp.origin] = dapp;
            return acc;
          }, {} as Record<IDapp['origin'], IDapp>)
        )
      ]).finally(() => {
        fetchingRef.current = false
      });
      const origTabList = tabs.map((tab) => {
        const origin = tab.url ? canoicalizeDappUrl(tab.url).origin : '';
        return {
          ...tab,
          ...origin && dapps[origin] && { localFavIconUrl: dapps[origin].faviconBase64 },
        }
      });

      setTabList(origTabList);

      const activeTab = origTabList.find((tab) => tab.active);
      if (activeTab) {
        updateActiveTab(activeTab);
      }
    },
    [ updateActiveTab ]
  )

  useEffect(() => {
    fetchTabListState();

    const onUpdate: Parameters<typeof chrome.tabs.onUpdated.addListener>[0] = (tabId, changeInfo) => {
      if (changeInfo.status === 'complete' || !changeInfo.favIconUrl) {
        fetchTabListState();
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdate);

    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdate);
    }
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

function useSelectedTabInfo(activeTab?: ChromeTab | null) {
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

export default function Topbar() {
  const { tabListDomRef, tabList, activeTab, tabActions } = useTopbar();

  const { winOSType, winState, winButtonActions } = useWinTriples();

  const selectedTabInfo = useSelectedTabInfo(activeTab);

  const { connectedSiteMap } = useConnectedSite();

  useEffect(() => {
    hideDappAddressbarSecurityPopupView();
  }, [ activeTab?.url ]);

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on('__internal_rpc:webui-extension:switch-active-dapp', ({ tabId }) => {
      chrome.tabs.update(tabId, { active: true });
    });

    return dispose;
  }, []);

  useEffect(() => {
    // debug-only
    if (!IS_RUNTIME_PRODUCTION && isMainWinShellWebUI(window.location.href)) {
      // window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:browser-dev:openDevTools');

      // window.open('https://app.uniswap.org');
      // window.open('https://debank.com');
    }
  }, []);

  return (
    <>
      <div id="tabstrip">
        {winOSType === 'darwin' && (
          <div className="macos-controls">
            <button
              type="button"
              className="control triple-close"
              onClick={winButtonActions.onCloseButton}
            >
              <img src={IconDarwinTripleClose} alt="close" />
              <img
                className="hover-show"
                src={IconDarwinTripleHoverClose}
                alt="close"
              />
            </button>
            <button
              type="button"
              className="control triple-minimize"
              onClick={winButtonActions.onMinimizeButton}
            >
              <img src={IconDarwinTripleMinimize} alt="minimize" />
              <img
                className="hover-show"
                src={IconDarwinTripleHoverMinimize}
                alt="minimize"
              />
            </button>
            <button
              type="button"
              className="control triple-fullscreen"
              onClick={winButtonActions.onFullscreenButton}
            >
              {winState === 'fullscreen' ? (
                <>
                  <img src={IconDarwinTripleFullscreen} alt="fullscreen" />
                  <img
                    className="hover-show"
                    src={IconDarwinTripleHoverRecover}
                    alt="fullscreen"
                  />
                </>
              ) : (
                <>
                  <img src={IconDarwinTripleFullscreen} alt="fullscreen" />
                  <img
                    className="hover-show"
                    src={IconDarwinTripleHoverFullscreen}
                    alt="fullscreen"
                  />
                </>
              )}
            </button>
          </div>
        )}
        <ul className="tab-list" ref={tabListDomRef}>
          {tabList.map((tab: ChromeTabWithLocalFavicon, idx) => {
            const key = `topbar-tab-${tab.id}-${idx}`;

            const faviconUrl = tab.localFavIconUrl || filterFavIcon(tab.url, tab.active) || tab.favIconUrl;
            const closable = filterClosable(tab.url, CLOSABLE);

            return (
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events */
              <li
                className="tab"
                data-active={tab.active}
                data-tab-id={`${tab.id}`}
                key={key}
                onClick={() => tabActions.onTabClick(tab)}
              >
                <img className="favicon" src={faviconUrl || undefined} />
                <div className="content">
                  <div className="title">{tab.title}</div>
                  {tab.url &&
                  connectedSiteMap[new URL(tab.url).origin]?.isConnected ? (
                    <div className="chain">
                      {connectedSiteMap[new URL(tab.url).origin]?.chainName}
                    </div>
                  ) : null}
                </div>
                <div className="controls">
                  {/* <button className="control audio" disabled={tab.audible && !tab.mutedInfo?.muted}>🔊</button> */}
                  {closable && (
                    <button
                      type="button"
                      className="control close"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        tabActions.onTabClose(tab);
                      }}
                    >
                      <img src={IconTabClose} className="normal" alt="close" />
                      <img
                        src={IconTabCloseHover}
                        className="inactive-hover"
                        alt="close"
                      />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {isDebug && (
          <button
            id="createtab"
            type="button"
            onClick={winButtonActions.onCreateTabButtonClick}
          >
            +
          </button>
        )}
        <div className="app-drag" />
        {winOSType === 'win32' && (
          <div className="window-controls">
            <button
              type="button"
              className="control triple-minimize"
              onClick={winButtonActions.onMinimizeButton}
            >
              <img src={IconWin32TripleMinimize} alt="minimize" />
            </button>
            <button
              type="button"
              className="control triple-maximize"
              onClick={winButtonActions.onMaximizeButton}
            >
              <img
                src={
                  winState === 'maximized'
                    ? IconWin32TripleRecover
                    : IconWin32TripleMaxmize
                }
                alt="maximize"
              />
            </button>
            <button
              type="button"
              className="control triple-close"
              onClick={winButtonActions.onCloseButton}
            >
              <img src={IconWin32TripleClose} alt="close" />
            </button>
          </div>
        )}
      </div>
      {WITH_NAV_BAR && (
        <div
          className={classnames('toolbar', activeTab?.url && isInternalProtocol(activeTab?.url) && 'internal-page')}
        >
          <div className="page-controls">
            <button
              id="goback"
              type="button"
              className="nav-control control"
              onClick={winButtonActions.onGoBackButtonClick}
              disabled={!selectedTabInfo?.canGoBack}
            >
              <img src={IconNavGoback} alt="close" />
            </button>
            <button
              id="goforward"
              type="button"
              className="nav-control control"
              onClick={winButtonActions.onGoForwardButtonClick}
              disabled={!selectedTabInfo?.canGoForward}
            >
              <img
                src={IconNavGoback}
                style={{ transform: 'rotate(180deg)' }}
                alt="close"
              />
            </button>
            <button
              id="reload"
              type="button"
              className="nav-control control"
              onClick={winButtonActions.onReloadButtonClick}
            >
              <img src={IconNavRefresh} alt="close" />
            </button>
          </div>
          <DappAddressBar url={activeTab?.url} />

          <browser-action-list id="actions" />
        </div>
      )}
    </>
  );
}
