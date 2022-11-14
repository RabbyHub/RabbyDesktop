/* eslint-disable no-underscore-dangle, @typescript-eslint/no-shadow */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/alt-text */
/// <reference types="chrome" />
/// <reference path="../../preload.d.ts" />

import React, { useEffect } from 'react';

import classnames from 'classnames';

import { hideDappAddressbarSecurityPopupView } from '@/renderer/ipcRequest/security-addressbarpopup';
import {
  ChromeTabWithLocalFavicon,
  useConnectedSite,
  useSelectedTabInfo,
  useTopbarTabs,
  useWinTriples,
} from '@/renderer/hooks/useWindowTopbar';

import {
  IconTabCloseHover,
  IconTabClose,
  IconNavGoback,
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
import {
  canoicalizeDappUrl,
  isInternalProtocol,
  isMainWinShellWebUI,
  parseOrigin,
  parseQueryString,
} from '../../../isomorphic/url';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_HOMEPAGE_URL,
} from '../../../isomorphic/constants';
import DappAddressBar from './DappAddressBar';

const isDebug = process.env.NODE_ENV !== 'production';

type CustomElement<T> = Partial<T & React.DOMAttributes<T> & { children: any }>;
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace JSX {
    interface IntrinsicElements {
      ['browser-action-list']: CustomElement<{ id: string }>;
    }
  }
}

const INIT_QS = parseQueryString();

const WITH_NAV_BAR = INIT_QS.__withNavigationbar === 'true';
const IS_MAINWIN_SHELL = INIT_QS.__webuiIsMainWindow === 'true';
const CLOSABLE = INIT_QS.__webuiClosable === 'true';

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

export default function Topbar() {
  const { tabListDomRef, tabList, activeTab, tabActions } = useTopbarTabs();

  const { winOSType, winState, winButtonActions } = useWinTriples();

  const selectedTabInfo = useSelectedTabInfo(activeTab);

  const { connectedSiteMap, fetchConnectedSite } = useConnectedSite();

  const selectedOrigin =
    canoicalizeDappUrl(selectedTabInfo?.tabUrl || '').origin || '';

  useEffect(() => {
    fetchConnectedSite();

    hideDappAddressbarSecurityPopupView();
  }, [selectedOrigin]);

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:webui-extension:switch-active-dapp',
      ({ tabId }) => {
        chrome.tabs.update(tabId, { active: true });
      }
    );

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

            const faviconUrl =
              tab.localFavIconUrl ||
              filterFavIcon(tab.url, tab.active) ||
              tab.favIconUrl;
            const closable = filterClosable(tab.url, CLOSABLE);
            const origin = parseOrigin(tab.url || '');

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
                  connectedSiteMap[origin]?.isConnected ? (
                    <div className="chain">
                      {connectedSiteMap[origin]?.chainName}
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
          className={classnames(
            'toolbar',
            selectedTabInfo?.tabUrl &&
              isInternalProtocol(selectedTabInfo?.tabUrl) &&
              'internal-page',
            IS_MAINWIN_SHELL && 'mainwin-shell'
          )}
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
          <DappAddressBar
            url={selectedTabInfo?.tabUrl}
            checkResult={selectedTabInfo?.dappSecurityCheckResult}
          />

          {/* <browser-action-list id="actions" /> */}
          <div className={'rabbyExtPanelPlaceHolder'} />
        </div>
      )}
    </>
  );
}
