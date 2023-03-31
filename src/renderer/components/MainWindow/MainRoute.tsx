import React, { useEffect, useMemo } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Home from '@/renderer/routes/Home';
import { ensurePrefix } from '@/isomorphic/string';
import { useWindowState } from '@/renderer/hooks-shell/useWindowState';
import { Swap } from '@/renderer/routes/Swap';
import { CurrentAccountAndNewAccount } from '../CurrentAccount';
import { MainWindowRouteData } from './type';

import styles from './MainRoute.module.less';

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

  return (
    <div className={classNames(styles.MainWindowRoute, classNameOnRoute)}>
      {!matchedData?.noDefaultHeader && (
        <div
          className={classNames(
            styles.headerBlock,
            matchedData?.floatingAccountComponent &&
              styles.floatingAccountComponent,
            'page-header-block'
          )}
          onDoubleClick={onDarwinToggleMaxmize}
        >
          <div className={classNames(styles.pageTitle, 'page-title')}>
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
      <div
        style={{
          display: location.pathname === '/mainwin/home' ? 'block' : 'none',
        }}
      >
        <Home />
      </div>
      <div
        style={{
          display: location.pathname === '/mainwin/swap' ? 'block' : 'none',
        }}
      >
        <Swap />
      </div>

      {!['/mainwin/home', '/mainwin/swap'].includes(location.pathname) &&
        children}
    </div>
  );
}
