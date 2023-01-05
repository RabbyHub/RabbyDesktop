/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { AutoUpdate } from '@/renderer/routes/Dapps/components/AutoUpdate';
import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import classNames from 'classnames';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

import {
  IDappWithTabInfo,
  useSidebarDapps,
} from '@/renderer/hooks-shell/useMainWindow';
import { useHasNewRelease } from '@/renderer/hooks/useAppUpdator';
import { makeSureDappOpened } from '@/renderer/ipcRequest/mainwin';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import styles from './Sidebar.module.less';
import { DappFavicon } from '../DappFavicon';

// keep in sync with css
const RouteItemH = 52;
const DividerSizes = {
  height: 1,
  marginTop: 8,
  marginBottom: 8,
};

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
  {
    path: '/mainwin/my-dapps',
    title: 'My Dapp',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/dapps.svg',
  },
] as const;

const DappRoutePatter = '/mainwin/dapps/:origin';

const TabList = ({
  className,
  dapps,
  activeTabId,
  dappActions,
  style,
}: {
  style?: React.CSSProperties;
  className?: string;
  dapps: IDappWithTabInfo[];
  activeTabId?: chrome.tabs.Tab['id'];
  dappActions: ReturnType<typeof useSidebarDapps>['dappActions'];
}) => {
  const navigateToDapp = useNavigateToDappRoute();
  const location = useLocation();
  if (!dapps?.length) {
    return null;
  }

  return (
    <ul className={classNames(styles.routeList, className)} style={style}>
      {dapps.map((dapp) => {
        const { tab } = dapp;
        const faviconUrl =
          dapp?.faviconBase64 || dapp?.faviconUrl || dapp.tab?.favIconUrl;

        return (
          <li
            key={`dapp-${dapp.origin}`}
            className={classNames(
              styles.routeItem,
              matchPath(DappRoutePatter, location.pathname) &&
                activeTabId &&
                activeTabId === tab?.id &&
                styles.active
            )}
            onClick={() => {
              if (dapp.tab) {
                dappActions.onSelectDapp(dapp.tab);
              } else {
                dappActions.onOpenDapp(dapp.origin);
              }
              navigateToDapp(dapp.origin);
            }}
            onContextMenu={(event) => {
              event?.preventDefault();

              const x = event.clientX;
              const y = event.clientY;
              showMainwinPopup(
                { x, y },
                {
                  type: 'sidebar-dapp',
                  dappTabInfo: { origin: dapp.origin, id: tab?.id },
                }
              );
            }}
          >
            <div className={styles.routeItemInner}>
              {!!tab &&
                (tab?.status === 'loading' ? (
                  <img
                    className={styles.loadingIcon}
                    src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-dapp-loading.svg"
                  />
                ) : (
                  <div className={classNames(styles.indicator)} />
                ))}
              <DappFavicon
                origin={dapp.origin}
                src={faviconUrl}
                className={classNames(styles.routeLogo, styles.isDapp)}
              />
              <span className={styles.routeTitle}>
                {dapp.alias || dapp.origin}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default function MainWindowSidebar() {
  const { allDapps, pinnedDapps, unpinnedOpenedDapps, activeTab, dappActions } =
    useSidebarDapps();

  const navigate = useNavigate();
  const location = useLocation();

  const { matchedSE, matchedDapp } = useMemo(() => {
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
          navigate(`/mainwin/my-dapps`, { replace: true });
        }
      }
    );

    return () => {
      dispose?.();
    };
  }, [navigate, matchedSE]);

  useEffect(() => {
    if (matchedDapp) {
      makeSureDappOpened(matchedDapp.params.origin!);
    }
  }, [matchedDapp]);

  useEffect(() => {
    if (!activeTab?.id) return;

    if (!matchedDapp || activeTab?.status === 'complete') {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:toggle-loading-view',
        {
          type: 'did-finish-load',
          tabId: activeTab.id,
        }
      );
    } else if (matchedDapp && activeTab?.status === 'loading') {
      const foundDapp = allDapps.find((dapp) => {
        return dapp.origin === canoicalizeDappUrl(activeTab.url || '')?.origin;
      });
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:toggle-loading-view',
        {
          type: 'start',
          tabId: activeTab.id,
          dapp: foundDapp!,
        }
      );
    }
  }, [matchedDapp, activeTab?.status, activeTab?.id, activeTab?.url, allDapps]);

  const hasNewRelease = useHasNewRelease();

  // todo 记住上次操作
  const [isFold, setIsFold] = useState(false);

  return (
    <div
      className={classNames(
        styles.Sidebar,
        isFold && styles.isFold,
        hasNewRelease && styles.hasNewRelease
      )}
    >
      <div className={styles.logoWrapper}>
        <img
          className={styles.logo}
          src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
        />
      </div>
      <div className={styles.menuFold} onClick={() => setIsFold((v) => !v)} />
      <div className={styles.dappsRouteList}>
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
                }}
              >
                <div className={styles.routeItemInner}>
                  <img className={styles.routeLogo} src={sE.logoSrc} />
                  <span className={styles.routeTitle}>{sE.title}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <TabList
          className={styles.pinnedList}
          style={
            {
              // maxHeight: `calc(100% - ${StaticEntries.length * RouteItemH}px)`,
              // height: `${pinnedDapps.length * 84}px`,
            }
          }
          dappActions={dappActions}
          dapps={pinnedDapps}
          activeTabId={activeTab?.id}
        />
        {unpinnedOpenedDapps?.length ? (
          <div className={styles.divider} style={DividerSizes} />
        ) : null}
        <TabList
          className={styles.unpinnedList}
          dappActions={dappActions}
          dapps={unpinnedOpenedDapps}
          activeTabId={activeTab?.id}
        />
      </div>
      <div className={styles.navFooter}>
        <div className={styles.update}>
          <AutoUpdate isFold={isFold} />
        </div>
        <ul className={styles.routeList}>
          <li
            className={classNames(
              styles.routeItem,
              matchPath('/mainwin/settings', location.pathname) && styles.active
            )}
            onClick={() => {
              navigate('/mainwin/settings');
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
