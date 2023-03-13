/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import classNames from 'classnames';
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Transition } from 'react-transition-group';
import styled from 'styled-components';

import {
  IDappWithTabInfo,
  useSidebarDapps,
} from '@/renderer/hooks-shell/useMainWindow';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import { useSettings } from '@/renderer/hooks/useSettings';
import { makeSureDappOpened } from '@/renderer/ipcRequest/mainwin';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useTransactionPendingCount } from '@/renderer/hooks/rabbyx/useTransaction';
import { Badge } from 'antd';
import { usePrevious } from 'react-use';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { DappFavicon } from '../DappFavicon';
import Hide from './Hide';
import styles from './Sidebar.module.less';

const DividerSizes = {
  height: 1,
  marginTop: 8,
  marginBottom: 8,
};

const Sidebar = styled.div`
  .${styles.menuFold} {
    background: url('rabby-internal://assets/icons/mainwin-sidebar/arrow-left.svg')
      center / 20px no-repeat;
    &:hover {
      background-image: url('rabby-internal://assets/icons/mainwin-sidebar/arrow-left-active.svg');
    }
  }

  &.${styles.isFold} {
    .${styles.menuFold} {
      background-image: url('rabby-internal://assets/icons/mainwin-sidebar/arrow-right.svg');
      &:hover {
        background-image: url('rabby-internal://assets/icons/mainwin-sidebar/arrow-right-active.svg');
      }
    }
  }
`;

const StaticEntries = [
  {
    path: '/mainwin/home',
    title: 'Home',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/home.svg',
  },
  // {
  //   path: '/mainwin/swap',
  //   title: 'Swap',
  //   logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/swap.svg',
  // },
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
  isFold,
}: {
  style?: React.CSSProperties;
  className?: string;
  dapps: IDappWithTabInfo[];
  activeTabId?: chrome.tabs.Tab['id'];
  dappActions: ReturnType<typeof useSidebarDapps>['dappActions'];
  isFold?: boolean;
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
              <div className={styles.dappIcon}>
                <DappFavicon origin={dapp.origin} src={faviconUrl} />
              </div>
              <Hide visible={!isFold} className={styles.routeTitle}>
                {dapp.alias || dapp.origin}
              </Hide>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default function MainWindowSidebar() {
  const { pinnedDapps, unpinnedOpenedDapps, activeTab, dappActions } =
    useSidebarDapps();

  const navigate = useNavigate();
  const location = useLocation();

  const { matchedSE, matchedDapp } = useMemo(() => {
    return {
      matchedSE: StaticEntries.find((sE) =>
        matchPath(
          {
            path: sE.path,
            end: false,
          },
          location.pathname
        )
      ),
      matchedDapp: matchPath(DappRoutePatter, location.pathname),
    };
  }, [location.pathname]);
  const prevMatchedDapp = usePrevious(matchedDapp);

  useEffect(() => {
    if (prevMatchedDapp?.params.origin !== matchedDapp?.params.origin) {
      walletController.rejectAllApprovals();
    }
  }, [prevMatchedDapp, matchedDapp]);

  useLayoutEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:all-tabs-closed',
      () => {
        if (!matchedSE) {
          navigate(`/mainwin/my-dapps`, { replace: true });
        }
      }
    );
  }, [navigate, matchedSE]);

  useEffect(() => {
    if (matchedDapp) {
      makeSureDappOpened(matchedDapp.params.origin!);
    }
  }, [matchedDapp]);

  const { hasNewRelease } = useCheckNewRelease({ isWindowTop: true });

  const { settings, toggleSidebarCollapsed } = useSettings();

  const pendingTxCount = useTransactionPendingCount();

  return (
    <Transition in={!settings.sidebarCollapsed} timeout={500}>
      {(state) => {
        const secondAnim = !(state === 'entered' && !settings.sidebarCollapsed);
        return (
          <Sidebar
            className={classNames(
              styles.Sidebar,
              ['exiting', 'exited'].includes(state) && styles.isFold,
              hasNewRelease && styles.hasNewRelease
            )}
          >
            <div className={styles.logoWrapper}>
              <img
                className={styles.logo}
                src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
              />
            </div>
            <div
              className={styles.menuFold}
              onClick={() => toggleSidebarCollapsed(!settings.sidebarCollapsed)}
            />
            <div className={styles.dappsRouteList}>
              <ul className={styles.routeList}>
                {StaticEntries.map((sE) => {
                  const isHome = sE.path === '/mainwin/home';

                  return (
                    <li
                      key={`sE-${sE.path}`}
                      className={classNames(
                        styles.routeItem,
                        matchPath(
                          {
                            path: sE.path,
                            end: false,
                          },
                          location.pathname
                        ) && styles.active
                      )}
                      onClick={() => {
                        navigate(sE.path);
                      }}
                    >
                      <div className={styles.routeItemInner}>
                        {isHome && secondAnim ? (
                          <Badge
                            className={classNames(
                              styles.txPendingCount,
                              styles.inCollapsed
                            )}
                            count={pendingTxCount}
                            color="#ffb020"
                          >
                            <img
                              className={styles.routeLogo}
                              src={sE.logoSrc}
                            />
                          </Badge>
                        ) : (
                          <img className={styles.routeLogo} src={sE.logoSrc} />
                        )}
                        <Hide
                          visible={!secondAnim}
                          className={styles.routeTitle}
                        >
                          <span>{sE.title}</span>
                          {isHome &&
                          !settings.sidebarCollapsed &&
                          pendingTxCount ? (
                            <Badge
                              className={styles.txPendingCount}
                              count={pendingTxCount}
                              color="#ffb020"
                            >
                              <span />
                            </Badge>
                          ) : null}
                        </Hide>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <TabList
                className={styles.pinnedList}
                style={{
                  // maxHeight: `calc(100% - ${StaticEntries.length * RouteItemH}px)`,
                  // height: `${pinnedDapps.length * 84}px`,
                  flexShrink: pinnedDapps.length < 5 ? 0 : 1,
                }}
                dappActions={dappActions}
                dapps={pinnedDapps}
                activeTabId={activeTab?.id}
                isFold={secondAnim}
              />
              {unpinnedOpenedDapps?.length ? (
                <div className={styles.divider} style={DividerSizes} />
              ) : null}
              <TabList
                className={styles.unpinnedList}
                dappActions={dappActions}
                dapps={unpinnedOpenedDapps}
                activeTabId={activeTab?.id}
                isFold={secondAnim}
                style={{
                  minHeight: 52 * Math.min(unpinnedOpenedDapps.length, 3),
                }}
              />
            </div>
            <div className={styles.navFooter}>
              <div
                className={styles.addDappContainer}
                onClick={() => {
                  showMainwinPopupview({ type: 'dapps-management' });
                }}
              >
                <div className={styles.addDapp}>
                  <img
                    className={styles.addDappIcon}
                    src="rabby-internal://assets/icons/mainwin-sidebar/add-square.svg"
                  />
                  <Hide visible={!secondAnim} className={styles.addDappContent}>
                    New Dapp
                  </Hide>
                </div>
              </div>
              <ul className={styles.routeList}>
                <li
                  className={classNames(
                    styles.routeItem,
                    matchPath('/mainwin/settings', location.pathname) &&
                      styles.active
                  )}
                  onClick={() => {
                    navigate('/mainwin/settings');
                  }}
                >
                  <div className={styles.routeItemInner}>
                    <img
                      className={styles.routeLogo}
                      src={
                        hasNewRelease && secondAnim
                          ? 'rabby-internal://assets/icons/mainwin-sidebar/setting-with-newrelease.svg'
                          : 'rabby-internal://assets/icons/mainwin-sidebar/setting.svg'
                      }
                    />
                    <Hide
                      visible={!secondAnim}
                      className={classNames(
                        styles.routeTitle,
                        styles.J_settings
                      )}
                    >
                      Settings
                      {hasNewRelease ? (
                        <span>
                          <img
                            className="ml-[4px]"
                            src="rabby-internal://assets/icons/mainwin-sidebar/icon-new-release.svg"
                          />
                        </span>
                      ) : null}
                    </Hide>
                  </div>
                </li>
              </ul>
            </div>
          </Sidebar>
        );
      }}
    </Transition>
  );
}
