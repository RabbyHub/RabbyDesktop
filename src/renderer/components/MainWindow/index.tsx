import {
  createMemoryRouter as createRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import GettingStarted from '@/renderer/routes/Welcome/GettingStarted';
import React, { useEffect } from 'react';
import ImportHome from '@/renderer/routes/Import/ImportHome';
import ImportByPrivateKey from '@/renderer/routes/ImportBy/ImportByPrivateKey';
import ImportSetPassword from '@/renderer/routes/Import/ImportSetPassword';
import ImportSuccessful from '@/renderer/routes/Import/ImportSuccessful';
import ImportByContainer from '@/renderer/routes/ImportBy/ImportByContainer';
import { Unlock } from '@/renderer/routes/Unlock/Unlock';
import { RequireUnlock } from '@/renderer/routes/RequireUnlock';
import {
  hideAllTabs,
  useForwardFromInternalPage,
} from '@/renderer/hooks-shell/useMainWindow';
import { useClickMainWindowHideContextMenu } from '@/renderer/hooks/useClick';
import ComingSoon from '@/renderer/routes/ComingSoon';
import { MainWindowSettings } from '@/renderer/routes/Settings';
import { useChromeTabsEvents } from '@/renderer/hooks-shell/useWindowTabs';
import { useTransactionChanged } from '@/renderer/hooks/rabbyx/useTransaction';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';
import Titlebar from '../Titlebar';
import { TopNavBar } from '../TopNavBar';
import { MainWindowRouteData } from './type';

function DappViewWrapper({
  children,
}: // eslint-disable-next-line @typescript-eslint/ban-types
React.PropsWithChildren<{}>) {
  useEffect(() => {
    return () => {
      console.debug('[debug] DappViewWrapper:: unmount');
      hideAllTabs(1);
    };
  }, []);

  return (
    <>
      {children || null}
      <div className={styles.dappViewGasket} />
    </>
  );
}

const router = createRouter([
  {
    path: '/welcome',
    id: 'welcome',
    element: <Outlet />,
    children: [
      {
        path: 'getting-started',
        element: (
          <div className={styles.welcomeScreen}>
            <GettingStarted />
          </div>
        ),
      },
      {
        path: 'import',
        element: (
          <div className={styles.ImportPage}>
            <Outlet />
          </div>
        ),
        children: [
          {
            path: 'home',
            element: <ImportHome />,
          },
          {
            path: 'set-password',
            element: <ImportSetPassword />,
          },
          {
            path: 'successful',
            element: <ImportSuccessful />,
          },
        ],
      },
    ],
  },
  {
    path: '/mainwin',
    id: 'mainwin',
    // errorElement: <ErrorBoundary />,
    element: (
      <RequireUnlock>
        <div className={styles.mainWindow}>
          <MainWindowSidebar />
          <MainRoute>
            <Outlet />
          </MainRoute>
        </div>
      </RequireUnlock>
    ),
    children: [
      {
        path: 'home',
        element: <ComingSoon pageName="Home" />,
      },
      {
        path: 'my-dapps',
        element: <DApps />,
        loader: () => {
          return {
            title: 'My Dapps',
            useAccountComponent: true,
          } as MainWindowRouteData;
        },
      },
      {
        path: 'swap',
        element: <ComingSoon pageName="Swap" />,
      },
      {
        path: 'dapps/:origin',
        element: (
          <DappViewWrapper>
            <TopNavBar />
          </DappViewWrapper>
        ),
      },
      {
        path: 'settings',
        element: <MainWindowSettings />,
        loader: () => {
          return {
            title: 'Settings',
            useAccountComponent: true,
          } as MainWindowRouteData;
        },
      },
    ],
  },
  {
    path: '/unlock',
    element: <Unlock />,
  },
  {
    path: '/import-by',
    id: 'import-by',
    element: (
      <div className={styles.ImportPage}>
        <ImportByContainer>
          <Outlet />
        </ImportByContainer>
      </div>
    ),
    children: [
      {
        path: 'private-key',
        element: <ImportByPrivateKey />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/mainwin/home" />,
  },
]);

export function MainWindow() {
  useClickMainWindowHideContextMenu();
  useForwardFromInternalPage(router);

  useTransactionChanged();

  useChromeTabsEvents();

  return (
    <>
      <Titlebar />
      <RouterProvider router={router} />
    </>
  );
}
