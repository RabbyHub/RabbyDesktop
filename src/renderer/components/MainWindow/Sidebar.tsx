/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import {
  RCIconDappsEdit,
  RCIconPin,
} from '@/../assets/icons/internal-homepage';
import { RABBY_HOMEPAGE_URL } from '@/isomorphic/constants';
import { useTopbarTabs } from '@/renderer/hooks/useWindowTopbar';
import { AutoUpdate } from '@/renderer/routes/Dapps/components/AutoUpdate';
import { showContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import { Button, Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { useLayoutEffect, useMemo } from 'react';
import {
  useNavigate,
  useLocation,
  matchPath,
  useMatches,
} from 'react-router-dom';

import styles from './Sidebar.module.less';

function filterFavIcon(url?: string, isActiveTab = false) {
  // homepage
  if (url?.startsWith(RABBY_HOMEPAGE_URL)) {
    return isActiveTab
      ? 'rabby-internal://assets/icons/internal-homepage/icon-home.svg'
      : 'rabby-internal://assets/icons/internal-homepage/icon-home-blur.svg';
  }

  return null;
}

const StaticEntries = [
  {
    path: '/mainwin/home',
    title: 'Home',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/home.svg',
  },
  {
    path: '/mainwin/swap',
    title: 'Swap',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/swap.svg',
  },
] as const;

const DappRoutePatter = '/mainwin/dapps/:origin';

export default function MainWindowSidebar() {
  const { activeTab, tabList, tabActions } = useTopbarTabs();

  const navigate = useNavigate();
  const navigateTo = useNavigateToDappRoute();
  const location = useLocation();

  const { matchedSE } = useMemo(() => {
    return {
      matchedSE: StaticEntries.find((sE) =>
        matchPath(sE.path, location.pathname)
      ),
      matchedDapp: matchPath(DappRoutePatter, location.pathname),
    };
  }, [location.pathname]);

  useLayoutEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:all-tabs-closed',
      () => {
        if (!matchedSE) {
          navigate(`/home`);
        }
      }
    );

    const dispose2 = window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:main-window:close-tab',
      (tabId) => {
        chrome.tabs.remove(tabId);
      }
    );

    return () => {
      dispose?.();
      dispose2?.();
    };
  }, [navigate, matchedSE]);

  return (
    <div className={styles.Sidebar}>
      <div className={styles.logoWrapper}>
        <img
          className={styles.logo}
          src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
        />
      </div>

      <ul className={styles.routeList}>
        {StaticEntries.map((sE) => {
          return (
            <li
              key={`sE-${sE.path}`}
              className={classNames(
                styles.routeItem,
                matchPath(sE.path, location.pathname) && styles.active
              )}
              onClick={() => {
                navigate(sE.path);
                tabActions.onHideAllTab();
              }}
            >
              <div className={styles.routeItemInner}>
                <img className={styles.routeLogo} src={sE.logoSrc} />
                <span className={styles.routeTitle}>{sE.title}</span>
              </div>
            </li>
          );
        })}

        {tabList.map((tab) => {
          const faviconUrl =
            tab.localFavIconUrl ||
            filterFavIcon(tab.url, tab.active) ||
            tab.favIconUrl;

          return (
            <Dropdown
              overlayClassName="dapps-dropdown-operations"
              getPopupContainer={() => document.body}
              trigger={['contextMenu']}
              key={tab.id}
              // open
              overlay={
                <Menu
                  onClick={({ key }) => {
                    switch (key) {
                      case 'dapp-pin':
                        break;
                      case 'dapp-close':
                        break;
                      default:
                        break;
                    }
                  }}
                  items={[
                    {
                      key: 'dapp-pin',
                      className: 'dapp-dropdown-item',
                      label: <span className="text">Pin</span>,
                      icon: <RCIconPin />,
                      // todo
                    },
                    {
                      key: 'dapp-close',
                      className: 'dapp-dropdown-item',
                      label: <span className="text">Close</span>,
                      icon: <RCIconDappsEdit />,
                    },
                  ]}
                />
              }
            >
              <li
                className={classNames(
                  styles.routeItem,
                  matchPath(DappRoutePatter, location.pathname) &&
                    activeTab?.id === tab.id &&
                    styles.active
                )}
                onClick={() => {
                  navigateTo(tab.dappOrigin!);
                  tabActions.onTabClick(tab);
                }}
              >
                <div className={styles.routeItemInner}>
                  <div className={styles.indicator} />
                  <img
                    className={classNames(styles.routeLogo, styles.isDapp)}
                    src={faviconUrl}
                  />
                  <span className={styles.routeTitle}>
                    {tab.dappAlias || tab.title}
                  </span>

                  {/* <img
                  onClick={() => {
                    tabActions.onTabClose(tab);
                  }}
                  className={styles.iconClose}
                  src="rabby-internal://assets/icons/mainwin-sidebar/icon-close-white.svg"
                /> */}
                </div>
              </li>
            </Dropdown>
          );
        })}
      </ul>
      <div className={styles.divider} />
      <ul className={styles.routeList}>
        {tabList.map((tab) => {
          const faviconUrl =
            tab.localFavIconUrl ||
            filterFavIcon(tab.url, tab.active) ||
            tab.favIconUrl;

          return (
            <li
              key={tab.id}
              className={classNames(
                styles.routeItem,
                matchPath(DappRoutePatter, location.pathname) &&
                  activeTab?.id === tab.id &&
                  styles.active
              )}
              onClick={() => {
                navigateTo(tab.dappOrigin!);
                tabActions.onTabClick(tab);
              }}
              onContextMenu={(event) => {
                event?.preventDefault();

                const x = event.clientX;
                const y = event.clientY;
                showContextMenuPopup(
                  { x, y },
                  { type: 'sidebar-dapp', dappTabInfo: tab }
                );
              }}
            >
              <div className={styles.routeItemInner}>
                <div className={styles.indicator} />
                <img
                  className={classNames(styles.routeLogo, styles.isDapp)}
                  src={faviconUrl}
                />
                <span className={styles.routeTitle}>
                  {tab.dappAlias || tab.title}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={styles.navFooter}>
        <div className={styles.update}>
          <AutoUpdate />
        </div>
        <ul className={styles.routeList}>
          <li
            className={classNames(
              styles.routeItem,
              matchPath('/settings', location.pathname) && styles.active
            )}
            onClick={() => {
              navigateTo('/mainwin/swap');
              tabActions.onHideAllTab();
            }}
          >
            <div className={styles.routeItemInner}>
              <img
                className={styles.routeLogo}
                src="rabby-internal://assets/icons/mainwin-sidebar/setting.svg"
              />
              <span className={styles.routeTitle}>Settings</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
