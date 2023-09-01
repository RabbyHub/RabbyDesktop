/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import classNames from 'classnames';
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { Transition } from 'react-transition-group';
import styled from 'styled-components';
import { useTransition, animated } from '@react-spring/web';

import {
  IDappWithTabInfo,
  useSidebarDapps,
} from '@/renderer/hooks-shell/useMainWindow';
import { useCheckNewRelease } from '@/renderer/hooks/useAppUpdator';
import { useSettings } from '@/renderer/hooks/useSettings';
import {
  closeTabFromInternalPage,
  makeSureDappOpened,
} from '@/renderer/ipcRequest/mainwin';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useTransactionPendingCount } from '@/renderer/hooks/rabbyx/useTransaction';
import { Badge } from 'antd';
import { usePrevious } from 'react-use';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { getLastOpenOriginByOrigin } from '@/renderer/ipcRequest/dapps';
import { useCurrentConnectedSite } from '@/renderer/hooks/useRabbyx';
import { useApprovalRiskAlertCount } from '@/renderer/hooks/rabbyx/useApprovals';
import clsx from 'clsx';
import { DappFavicon } from '../DappFavicon';
import Hide from './Hide';
import styles from './Sidebar.module.less';
import { toastMessage } from '../TransparentToast';

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

type EntryBasic = {
  path: string;
  title: string;
  logoSrc: string;
};

const StaticEntries: (
  | (EntryBasic & {
      getBadgeNode?: (ctx: {
        isActivePath: boolean;
        count: number;
        isCollapsed: boolean;
        config: EntryBasic;
      }) => React.ReactNode;
    })
  | {
      type: 'divider';
    }
)[] = [
  {
    path: '/mainwin/home',
    title: 'Home',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/home.svg',
    getBadgeNode: (ctx) => {
      if (ctx.isCollapsed) {
        return (
          <Badge
            className={classNames(styles.seCountBadge, styles.inCollapsed)}
            count={ctx.count}
            color="#8ba8ff"
          >
            <img className={styles.routeLogo} src={ctx.config.logoSrc} />
          </Badge>
        );
      }

      if (ctx.count) {
        return (
          <Badge
            className={styles.seCountBadge}
            count={ctx.count}
            color="#8ba8ff"
          >
            <span />
          </Badge>
        );
      }

      return null;
    },
  },
  {
    path: '/mainwin/home/nft',
    title: 'NFT',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/nft.svg',
  },
  {
    path: '/mainwin/home/send-token',
    title: 'Send',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/send.svg',
  },
  {
    path: '/mainwin/swap',
    title: 'Swap',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/swap.svg',
  },
  {
    path: '/mainwin/approvals',
    title: 'Approvals',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/approvals.svg',
    getBadgeNode: (ctx) => {
      if (ctx.isCollapsed) {
        return (
          <Badge
            className={classNames(styles.seCountBadge, styles.inCollapsed)}
            count={ctx.count}
            color="#ec5151"
          >
            <img className={styles.routeLogo} src={ctx.config.logoSrc} />
          </Badge>
        );
      }

      if (ctx.count) {
        return (
          <Badge
            className={styles.seCountBadge}
            count={ctx.count}
            color="#ec5151"
          >
            <span />
          </Badge>
        );
      }

      return null;
    },
  },
  {
    type: 'divider' as const,
  },
  {
    path: '/mainwin/my-dapps',
    title: 'My Dapps',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/dapps.svg',
  },
];

const DappRoutePattern = '/mainwin/dapps/:dappId';

const DappIndicator = ({ tab }: { tab?: chrome.tabs.Tab }) => {
  const handleClose: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (tab?.id) {
      closeTabFromInternalPage(tab.id);
      toastMessage({
        type: 'success',
        content: 'Closed',
      });
    }
  };
  if (!tab) {
    return null;
  }
  return (
    <div className={styles.dappIndicator}>
      {tab?.status === 'loading' ? (
        <img
          className={styles.loadingIcon}
          src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-dapp-loading.svg"
        />
      ) : (
        <div className={classNames(styles.indicator)} />
      )}
      <img
        src="rabby-internal://assets/icons/mainwin-sidebar/icon-close.svg"
        alt=""
        onClick={handleClose}
        className={styles.closeIcon}
      />
    </div>
  );
};

const DappIcon = ({
  src,
  origin,
  tab,
}: {
  origin: string;
  tab?: chrome.tabs.Tab;
  src?: string;
}) => {
  const currentConnectedSite = useCurrentConnectedSite({
    origin,
    tab,
  });
  return (
    <DappFavicon
      origin={origin}
      src={src}
      chain={currentConnectedSite?.chain}
    />
  );
};

function useAutoScrollToActiveTab(currentDappID?: string) {
  const dappListRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const ele = dappListRef.current;

    if (!ele) return;
    if (!currentDappID) return;

    const timer = setTimeout(() => {
      const activeTabLi: HTMLLIElement | null = ele.querySelector(
        'ul > li[data-activetab="true"]'
      );

      // activeTabLi?.scrollIntoViewIfNeeded();
      activeTabLi?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      });
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [currentDappID]);

  return { dappListRef };
}

const TabList = ({
  className,
  dapps,
  activeTabId,
  dappActions,
  style,
  isFold,
  otherDapps,
}: {
  style?: React.CSSProperties;
  className?: string;
  dapps: IDappWithTabInfo[];
  activeTabId?: chrome.tabs.Tab['id'];
  dappActions: ReturnType<typeof useSidebarDapps>['dappActions'];
  isFold?: boolean;
  otherDapps?: IDappWithTabInfo[];
}) => {
  const navigateToDapp = useNavigateToDappRoute();
  const rLoc = useLocation();

  const transitions = useTransition(dapps, {
    initial: { scale: 1 },
    enter: { scale: 1 },
    leave: { scale: 0 },
    config: { duration: 300 },
    keys: (dapp) => dapp.origin,
  });

  return (
    <ul className={classNames(styles.routeList, className)} style={style}>
      {transitions((s, dapp) => {
        const { tab } = dapp;
        const faviconUrl =
          dapp?.faviconBase64 || dapp?.faviconUrl || dapp.tab?.favIconUrl;

        const matchedRoute = matchPath(DappRoutePattern, rLoc.pathname);
        const matchedDappID = matchedRoute?.params.dappId || '';
        if (otherDapps && otherDapps.find((e) => e.origin === dapp.origin)) {
          return null;
        }

        const isActiveTab =
          matchedDappID && activeTabId && activeTabId === tab?.id;

        return (
          <animated.li
            style={s}
            key={`dapp-${dapp.origin}`}
            className={classNames(
              styles.routeItem,
              matchedDappID &&
                activeTabId &&
                activeTabId === tab?.id &&
                styles.active
            )}
            data-activetab={isActiveTab ? 'true' : 'false'}
            onClick={async () => {
              let shouldNav = false;
              if (dapp.tab) {
                dappActions.onSelectDapp(dapp.tab);
                shouldNav = true;
              } else {
                const lastOrigin = await getLastOpenOriginByOrigin(dapp.origin);
                const openRes = await dappActions.onOpenDapp(lastOrigin);
                shouldNav = !!openRes.shouldNavTabOnClient;
              }

              if (shouldNav) navigateToDapp(dapp.origin);
            }}
            onContextMenu={(event) => {
              event?.preventDefault();

              const x = event.clientX;
              const y = event.clientY;
              showMainwinPopup(
                { x, y },
                {
                  type: 'sidebar-dapp-contextmenu',
                  dappTabInfo: {
                    dappID: dapp.id,
                    dappOrigin: dapp.origin,
                    dappType: dapp.type,
                    id: tab?.id,
                    url: tab?.url,
                  },
                }
              );
            }}
          >
            <DappIndicator tab={tab} />
            <div className={styles.routeItemInner}>
              <div className={styles.dappIcon}>
                <DappIcon
                  origin={dapp.origin}
                  src={faviconUrl}
                  tab={dapp.tab}
                />
              </div>
              <Hide visible={!isFold} className={styles.routeTitle}>
                {dapp.alias || dapp.origin}
              </Hide>
            </div>
          </animated.li>
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
      matchedSE: StaticEntries.find(
        (sE) =>
          !('type' in sE) &&
          matchPath(
            {
              path: sE.path,
              end: false,
            },
            location.pathname
          )
      ),
      matchedDapp: matchPath(DappRoutePattern, location.pathname),
    };
  }, [location.pathname]);
  const prevMatchedDapp = usePrevious(matchedDapp);

  useEffect(() => {
    if (prevMatchedDapp?.params.dappId !== matchedDapp?.params.dappId) {
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
      makeSureDappOpened(matchedDapp.params.dappId!);
    } else {
      // cancel mainTabbedWindow's selection
      // window.rabbyDesktop.ipcRenderer.sendMessage('__internal_rpc:mainwindow:unconfirmed-unselect-all');
    }
  }, [matchedDapp]);

  const { approvalRiskAlertCount } = useApprovalRiskAlertCount();

  const { hasNewRelease } = useCheckNewRelease({ isWindowTop: true });

  const { settings, toggleSidebarCollapsed } = useSettings();

  const pendingTxCount = useTransactionPendingCount();

  const { dappListRef } = useAutoScrollToActiveTab(matchedDapp?.params?.dappId);

  return (
    <Transition in={!settings.sidebarCollapsed} timeout={500}>
      {(state) => {
        const secondAnim = !(state === 'entered' && !settings.sidebarCollapsed);
        const isFolded = !!secondAnim;
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
                  if ('type' in sE) {
                    return (
                      <li className={styles.divider} style={DividerSizes} />
                    );
                  }
                  const isHome = sE.path === '/mainwin/home';
                  const isApprovals = sE.path === '/mainwin/approvals';
                  const pathname =
                    location.pathname === '/mainwin/home/bundle'
                      ? '/mainwin/home'
                      : location.pathname === '/mainwin/home/send-nft'
                      ? '/mainwin/home/send-token'
                      : location.pathname;

                  const matchedPath = matchPath(
                    {
                      path: sE.path,
                      // end: false,
                    },
                    pathname
                  );

                  const ctxCount = isHome
                    ? pendingTxCount
                    : isApprovals
                    ? approvalRiskAlertCount
                    : 0;

                  return (
                    <li
                      key={`sE-${sE.path}`}
                      className={classNames(
                        styles.routeItem,
                        matchedPath && styles.active
                      )}
                      onClick={() => {
                        navigate(sE.path);
                      }}
                    >
                      <div className={styles.routeItemInner}>
                        {sE.getBadgeNode && secondAnim ? (
                          sE.getBadgeNode({
                            isCollapsed: true,
                            isActivePath: !!matchedPath,
                            count: ctxCount,
                            config: sE,
                          }) || null
                        ) : (
                          <img className={styles.routeLogo} src={sE.logoSrc} />
                        )}
                        <Hide
                          visible={!secondAnim}
                          className={classNames(
                            styles.routeTitle,
                            sE.getBadgeNode && styles.withBadge
                          )}
                        >
                          <span>{sE.title}</span>
                          {(!settings.sidebarCollapsed &&
                            sE.getBadgeNode?.({
                              isCollapsed: false,
                              isActivePath: !!matchedPath,
                              count: ctxCount,
                              config: sE,
                            })) ||
                            null}
                        </Hide>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div ref={dappListRef} className={styles.dappList}>
                <TabList
                  className={styles.pinnedList}
                  dappActions={dappActions}
                  dapps={pinnedDapps}
                  otherDapps={unpinnedOpenedDapps}
                  activeTabId={activeTab?.id}
                  isFold={secondAnim}
                />
                <TabList
                  className={styles.unpinnedList}
                  dappActions={dappActions}
                  dapps={unpinnedOpenedDapps}
                  otherDapps={pinnedDapps}
                  activeTabId={activeTab?.id}
                  isFold={secondAnim}
                />
              </div>
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
                  <div className={clsx(styles.routeItemInner)}>
                    <img
                      className={clsx(
                        styles.routeLogo,
                        isFolded && 'relative right-[-4px]'
                      )}
                      src={
                        hasNewRelease && secondAnim
                          ? 'rabby-internal://assets/icons/mainwin-sidebar/more-with-newrelease.svg'
                          : 'rabby-internal://assets/icons/mainwin-sidebar/more.svg'
                      }
                    />
                    <Hide
                      visible={!secondAnim}
                      className={classNames(
                        styles.routeTitle,
                        styles.J_settings
                      )}
                    >
                      More
                      {hasNewRelease ? (
                        <span>
                          <img
                            className="ml-[9px]"
                            src="rabby-internal://assets/icons/mainwin-sidebar/icon-detected-update.svg"
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
