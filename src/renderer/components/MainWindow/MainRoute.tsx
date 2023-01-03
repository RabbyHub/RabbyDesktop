import React, { useMemo } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { CurrentAccountAndNewAccount } from '../CurrentAccount';
import styles from './MainRoute.module.less';
import { MainWindowRouteData } from './type';

export default function MainWindowMain({
  children,
}: React.PropsWithChildren<object>) {
  const location = useLocation();
  const matches = useMatches();

  const matchedData = useMemo(() => {
    return matches.find((match) => match.pathname === location.pathname)
      ?.data as MainWindowRouteData;
  }, [matches, location.pathname]);

  return (
    <div className={styles.Main}>
      {matchedData && (
        <div className={styles.headerBlock}>
          <div className={styles.pageTitle}>{matchedData.title || null}</div>
          {matchedData.useAccountComponent && (
            <div className={styles.accountComponent}>
              <CurrentAccountAndNewAccount />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
