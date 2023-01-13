import {
  createMemoryRouter as createRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import GettingStarted from '@/renderer/routes/Welcome/GettingStarted';
import ImportHome from '@/renderer/routes/Import/ImportHome';
import ImportByPrivateKey from '@/renderer/routes/ImportBy/ImportByPrivateKey';
import ImportSetPassword from '@/renderer/routes/Import/ImportSetPassword';
import ImportSuccessful from '@/renderer/routes/Import/ImportSuccessful';
import ImportByContainer from '@/renderer/routes/ImportBy/ImportByContainer';
import { Unlock } from '@/renderer/routes/Unlock/Unlock';
import { RequireUnlock } from '@/renderer/routes/RequireUnlock';
import { useForwardFromInternalPage } from '@/renderer/hooks-shell/useMainWindow';
import { useClickMainWindowHideContextMenu } from '@/renderer/hooks/useClick';
import ComingSoon from '@/renderer/routes/ComingSoon';
import { MainWindowSettings } from '@/renderer/routes/Settings';
import { useChromeTabsEvents } from '@/renderer/hooks-shell/useWindowTabs';
import { useTransactionChanged } from '@/renderer/hooks/rabbyx/useTransaction';
import { useMainWindowEvents } from '@/renderer/hooks-shell/useWindowState';
import { useAppUnlockEvents } from '@/renderer/hooks/rabbyx/useUnlocked';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import openApi from '@/renderer/utils/openapi';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useEffect } from 'react';
import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';
import Titlebar from '../Titlebar';
import { TopNavBar } from '../TopNavBar';
import { MainWindowRouteData } from './type';
import { DappViewWrapper } from '../DappView';
import { useMessageForwardToMainwin } from '@/renderer/hooks/useMessageToMainwin';

function WelcomeWrapper() {
  const { hasFetched, accounts } = useAccounts();

  if (hasFetched && accounts.length) {
    return <Navigate to="/mainwin/home" />;
  }

  return <Outlet />;
}

function MainWrapper() {
  const { hasFetched, accounts } = useAccounts();

  if (hasFetched && !accounts.length) {
    return <Navigate to="/welcome/getting-started" />;
  }

  return (
    <RequireUnlock>
      <div className={styles.mainWindow}>
        <MainWindowSidebar />
        <MainRoute>
          <Outlet />
        </MainRoute>
      </div>
    </RequireUnlock>
  );
}

const router = createRouter([
  {
    path: '/welcome',
    id: 'welcome',
    element: <WelcomeWrapper />,
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
    element: <MainWrapper />,
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

  useAppUnlockEvents();

  useMainWindowEvents();
  useChromeTabsEvents();

  useEffect(() => {
    if (!IS_RUNTIME_PRODUCTION) {
      const host = openApi.getHost();
      console.debug('[debug] getHost', host);

      walletOpenapi.getHost().then((hostInWallet) => {
        console.debug('[debug] walletOpenapi', hostInWallet);
      });
    }
  }, []);

  useMessageForwardToMainwin('route-navigate', (payload) => {
    console.log(payload);
    router.navigate(payload.data);
  });

  return (
    <>
      <Titlebar />
      <RouterProvider router={router} />
    </>
  );
}
