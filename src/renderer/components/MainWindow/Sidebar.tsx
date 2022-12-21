/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { AutoUpdate } from '@/renderer/routes/Dapps/components/AutoUpdate';
import { showContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
import classNames from 'classnames';
import { useLayoutEffect, useMemo } from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';

import {
  IDappWithTabInfo,
  useSidebarDapps,
} from '@/renderer/hooks-shell/useMainWindow';
import styles from './Sidebar.module.less';

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

const TabList = ({
  dapps,
  activeTabId,
  dappActions,
}: {
  dapps: IDappWithTabInfo[];
  activeTabId?: chrome.tabs.Tab['id'];
  dappActions: ReturnType<typeof useSidebarDapps>['dappActions'];
}) => {
  const navigateTo = useNavigateToDappRoute();
  const location = useLocation();
  if (!dapps?.length) {
    return null;
  }

  return (
    <ul className={styles.routeList}>
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
              navigateTo(dapp.origin);
              if (dapp.tab) {
                dappActions.onTabClick(dapp.tab);
              } else {
                chrome.tabs.create({
                  url: dapp.origin,
                  active: true,
                });
              }
            }}
            onContextMenu={(event) => {
              event?.preventDefault();

              const x = event.clientX;
              const y = event.clientY;
              showContextMenuPopup(
                { x, y },
                {
                  type: 'sidebar-dapp',
                  dappTabInfo: { origin: dapp.origin, id: tab?.id },
                }
              );
            }}
          >
            <div className={styles.routeItemInner}>
              {!!tab && <div className={styles.indicator} />}
              <img
                className={classNames(styles.routeLogo, styles.isDapp)}
                src={faviconUrl}
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
  const { pinnedDapps, unpinnedOpenedDapps, activeTab, dappActions } =
    useSidebarDapps();

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

    return () => {
      dispose?.();
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
                dappActions.onHideAllTab();
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
        dappActions={dappActions}
        dapps={pinnedDapps}
        activeTabId={activeTab?.id}
      />
      {unpinnedOpenedDapps?.length ? <div className={styles.divider} /> : null}
      <TabList
        dappActions={dappActions}
        dapps={unpinnedOpenedDapps}
        activeTabId={activeTab?.id}
      />
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
              dappActions.onHideAllTab();
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
