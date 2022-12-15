/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { RABBY_HOMEPAGE_URL } from '@/isomorphic/constants';
import { useTopbarTabs } from '@/renderer/hooks/useWindowTopbar';
import { useNavigateToDappRoute } from '@/renderer/utils/react-router';
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
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg',
  },
  {
    path: '/mainwin/swap',
    title: 'Swap',
    logoSrc: 'rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg',
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

    return dispose;
  }, [navigate, matchedSE]);

  // console.log('[feat] matchedSE', matchedSE);
  // console.log('[feat] matchedDapp', matchedDapp);
  // console.log('[feat] activeTab?.dappOrigin', activeTab?.dappOrigin);

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
            >
              <div className={styles.routeItemInner}>
                <img className={styles.routeLogo} src={faviconUrl} />
                <span className={styles.routeTitle}>
                  {tab.dappAlias || tab.title}
                </span>

                <img
                  onClick={() => {
                    tabActions.onTabClose(tab);
                  }}
                  className={styles.iconClose}
                  src="rabby-internal://assets/icons/mainwin-sidebar/icon-close-white.svg"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
