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
import { parseQueryString } from '../../../isomorphic/url';

import { useWindowState } from '../../hooks/useWindowState';
import {
  RABBY_HOMEPAGE_URL,
  RABBY_INTERNAL_PROTOCOL,
} from '../../../isomorphic/constants';

const isDebug = process.env.NODE_ENV !== 'production';

type ChromeTab = chrome.tabs.Tab;
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

function isInternalProtocol(url: string) {
  return [
    `${RABBY_INTERNAL_PROTOCOL}//`,
    'chrome-extension://',
    'chrome://',
  ].some((protocol) => url.startsWith(protocol));
}

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

// type GetListenerParams<T> = T extends (...args: infer A) => any ? A : never;
type GetListenerFirstParams<T> = T extends (...args: infer A) => any
  ? A[0]
  : never;

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

function useTopbar() {
  const [origTabList, setTabList] = useState<ChromeTab[]>([]);
  const [activeTabId, setActiveId] = useState<ChromeTab['id']>(-1);
  const [windowId, setWindowId] = useState<number | undefined>(undefined);

  const { tabList, activeTab } = useMemo(() => {
    let activeTab = null as ChromeTab | null;
    const tabList: ChromeTab[] = origTabList.map((_tab) => {
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

  useEffect(() => {
    (async () => {
      const tabs = await new Promise<ChromeTab[]>((resolve) =>
        chrome.tabs.query({ windowId: -2 }, resolve)
      );
      const origTabList = [...tabs];

      setTabList(origTabList);

      const activeTab = origTabList.find((tab) => tab.active);
      if (activeTab) {
        updateActiveTab(activeTab);
      }
    })();
  }, [updateActiveTab]);

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

  const onAddressUrlKeyUp = useCallback(
    (
      event: GetListenerFirstParams<
        React.HTMLAttributes<HTMLInputElement>['onKeyUp']
      >
    ) => {
      if (event.key === 'Enter') {
        const url = (event.target as HTMLInputElement).value;
        chrome.tabs.update({ url });
      }
    },
    []
  );

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
    onAddressUrlKeyUp,
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
    window.rabbyDesktop.ipcRenderer.sendMessage('webui-ext-navinfo', activeTab.id);

    return () => dispose?.();
  }, [activeTab?.id, activeTab?.url]);

  return selectedTabInfo;
}

function useAddressUrl(updatedUrl?: string) {
  const [addressUrl, setAddressUrl] = useState(updatedUrl || '');
  const onAddressUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddressUrl(e.target.value);
    },
    []
  );

  useEffect(() => {
    setAddressUrl(updatedUrl || '');
  }, [updatedUrl]);

  return {
    addressUrl,
    isInternalUrl: useMemo(() => isInternalProtocol(addressUrl), [addressUrl]),
    onAddressUrlChange,
  };
}

export default function Topbar() {
  const { tabListDomRef, tabList, activeTab, onAddressUrlKeyUp, tabActions } =
    useTopbar();

  const { winOSType, winState, winButtonActions } = useWinTriples();

  const selectedTabInfo = useSelectedTabInfo(activeTab);

  const { addressUrl, isInternalUrl, onAddressUrlChange } = useAddressUrl(
    activeTab?.url
  );

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
          {tabList.map((tab: ChromeTab, idx) => {
            const key = `topbar-tab-${tab.id}-${idx}`;

            const faviconUrl =
              filterFavIcon(tab.url, tab.active) || tab.favIconUrl;
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
                <span className="title">{tab.title}</span>
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
          className={classnames('toolbar', isInternalUrl && 'internal-page')}
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
          <div className="address-bar">
            {isInternalUrl ? (
              <div className="hidden-address" />
            ) : (
              <input
                id="addressurl"
                spellCheck={false}
                value={addressUrl}
                disabled
                // defaultValue={activeTab?.url || ''}
                onKeyUp={onAddressUrlKeyUp}
                onChange={onAddressUrlChange}
              />
            )}
          </div>
          <browser-action-list id="actions" />
        </div>
      )}
    </>
  );
}
