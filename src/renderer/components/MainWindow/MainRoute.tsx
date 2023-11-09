import React, { useEffect, useMemo } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';
import classNames from 'classnames';

import { ensurePrefix } from '@/isomorphic/string';
import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import { CurrentAccountAndNewAccount } from '../CurrentAccount';
import { MainWindowRouteData } from './type';

import styles from './MainRoute.module.less';
import { DappViewWrapper } from '../DappView';
import { TopNavBar } from '../TopNavBar';

function convertPathnameToClassName(pathname: string) {
  return pathname.replace(/\/|:/g, '_');
}

function useMainWindowClassName(pname: string, extraRouteCSSKeyword?: string) {
  const { classNameOnRoute, classNameOnHtml } = useMemo(() => {
    const className = convertPathnameToClassName(pname);
    const onRoutes = [
      className ? `route${ensurePrefix(className, '_')}` : '',
      extraRouteCSSKeyword
        ? `route${ensurePrefix(extraRouteCSSKeyword, '_')}`
        : '',
    ].filter(Boolean);
    const onHtmls = [
      className ? `page${ensurePrefix(className, '_')}` : '',
      extraRouteCSSKeyword
        ? `page${ensurePrefix(extraRouteCSSKeyword, '_')}`
        : '',
    ].filter(Boolean);

    return {
      classNameOnRoute: onRoutes,
      classNameOnHtml: onHtmls,
    };
  }, [pname, extraRouteCSSKeyword]);

  useEffect(() => {
    document.documentElement.classList.add(...classNameOnHtml);

    return () => {
      document.documentElement.classList.remove(...classNameOnHtml);
    };
  }, [classNameOnHtml]);

  return classNameOnRoute;
}

export default function MainWindowRoute({
  children,
}: React.PropsWithChildren<object>) {
  const location = useLocation();
  const matches = useMatches();

  const matchedData = useMemo(() => {
    return matches.find((match) => match.pathname === location.pathname)
      ?.data as MainWindowRouteData;
  }, [matches, location.pathname]);

  const classNameOnRoute = useMainWindowClassName(
    location.pathname,
    matchedData?.routeCSSKeyword
  );

  const navigate = useNavigate();
  const { onDarwinToggleMaxmize } = useWindowState();

  const { isDappRoute } = useMemo(() => {
    return {
      isDappRoute: location.pathname.startsWith('/mainwin/dapps/'),
    };
  }, [location.pathname]);

  return (
    <div className={classNames(styles.MainWindowRoute, classNameOnRoute)}>
      {!matchedData?.noDefaultHeader && (
        <div
          className={classNames(
            styles.headerBlock,
            matchedData?.floatingAccountComponent &&
              styles.floatingAccountComponent,
            'page-header-block',
            matchedData?.headerBlockClassName
          )}
          onDoubleClick={onDarwinToggleMaxmize}
        >
          <div
            className={classNames(
              styles.pageTitle,
              matchedData?.pageTitleClassName,
              'page-title'
            )}
          >
            {matchedData?.backable ? (
              <img
                src="rabby-internal://assets/icons/common/back.svg"
                className={classNames(styles.pageBack, 'icon-back')}
                alt=""
                onClick={() => {
                  navigate(-1);
                }}
              />
            ) : null}
            {matchedData?.title || null}
          </div>
          <div className={styles.accountComponent}>
            <CurrentAccountAndNewAccount />
          </div>
        </div>
      )}
      <div style={{ display: isDappRoute ? 'block' : 'none' }}>
        <DappViewWrapper>
          <TopNavBar />
        </DappViewWrapper>
      </div>
      {children}
    </div>
  );
}
