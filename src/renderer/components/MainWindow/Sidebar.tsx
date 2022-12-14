/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import { RABBY_HOMEPAGE_URL } from '@/isomorphic/constants';
import { useTopbarTabs } from '@/renderer/hooks/useWindowTopbar';
import classNames from 'classnames';
import { useNavigate } from 'react-router-dom';

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

export default function MainWindowSidebar() {
  const { activeTab, tabList, tabActions } = useTopbarTabs();

  const navigate = useNavigate();

  return (
    <div className={styles.Sidebar}>
      <div className={styles.logoWrapper}>
        <img
          className={styles.logo}
          src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
        />
      </div>

      <ul className={styles.routeList}>
        <li
          className={styles.routeItem}
          onClick={() => {
            navigate('/dapps');
            tabActions.onHideAllTab();
          }}
        >
          <div className={styles.routeItemInner}>
            <img
              className={styles.routeLogo}
              src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
            />
            <span className={styles.routeTitle}>Home</span>
          </div>
        </li>
        <li
          className={styles.routeItem}
          onClick={() => {
            // navigate('/swaps')
          }}
        >
          <div className={styles.routeItemInner}>
            <img
              className={styles.routeLogo}
              src="rabby-internal://assets/icons/mainwin-sidebar/sidebar-logo.svg"
            />
            <span className={styles.routeTitle}>Swap</span>
          </div>
        </li>

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
                activeTab?.id === tab.id && styles.active
              )}
              onClick={() => {
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
