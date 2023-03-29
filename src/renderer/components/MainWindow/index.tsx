import { useEffect } from 'react';
import {
  createHashRouter as createRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import GettingStarted from '@/renderer/routes/Welcome/GettingStarted';
import Home from '@/renderer/routes/Home';
import ImportHome from '@/renderer/routes/Import/ImportHome';
import ImportByPrivateKey from '@/renderer/routes/ImportBy/ImportByPrivateKey';
import ImportSetPassword from '@/renderer/routes/Import/ImportSetPassword';
import ImportSuccessful from '@/renderer/routes/Import/ImportSuccessful';
import ImportByContainer from '@/renderer/routes/ImportBy/ImportByContainer';
import SendToken from '@/renderer/routes/SendToken';
import { Unlock } from '@/renderer/routes/Unlock/Unlock';
import { RequireUnlock } from '@/renderer/routes/RequireUnlock';
import { useForwardFromInternalPage } from '@/renderer/hooks-shell/useMainWindow';
import { useClickMainWindowHideContextMenu } from '@/renderer/hooks/useClick';
import { MainWindowSettings } from '@/renderer/routes/Settings';
import { useChromeTabsEvents } from '@/renderer/hooks-shell/useWindowTabs';
import { useTransactionChanged } from '@/renderer/hooks/rabbyx/useTransaction';
import { useMainWindowEvents } from '@/renderer/hooks-shell/useWindowState';
import { useAppUnlockEvents } from '@/renderer/hooks/rabbyx/useUnlocked';
import { useAccounts } from '@/renderer/hooks/rabbyx/useAccount';
import {
  useMessageForwarded,
  useMessageForwardToMainwin,
} from '@/renderer/hooks/useViewsMessage';
import { navigateToDappRoute } from '@/renderer/utils/react-router';
import { Swap } from '@/renderer/routes/Swap';
import { ErrorBoundary } from '@sentry/react';
import { useMount } from 'ahooks';
import { matomoRequestEvent } from '@/renderer/utils/matomo-request';
import { fetchDapps } from '@/renderer/ipcRequest/dapps';
import dayjs from 'dayjs';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';
import Titlebar from '../Titlebar';
import { TopNavBar } from '../TopNavBar';
import { MainWindowRouteData } from './type';
import { DappViewWrapper } from '../DappView';
import { FixedBackHeader } from '../FixedBackHeader';

const logGetUserDapp = async () => {
  const lastLogTime = localStorage.getItem('matomo_last_log_time') || 0;
  if (dayjs().isSame(+lastLogTime, 'day')) {
    return;
  }
  await matomoRequestEvent({
    category: 'My Dapp',
    action: 'Get User Dapp',
    value: await fetchDapps().then((res) => res?.dapps?.length || 0),
  });
  localStorage.setItem('matomo_last_log_time', Date.now().toString());
};

function WelcomeWrapper() {
  const { localHasFetched, accounts } = useAccounts();

  if (localHasFetched && accounts.length) {
    return <Navigate to="/mainwin/home" />;
  }

  return <Outlet />;
}

function MainWrapper() {
  const { localHasFetched, accounts, fetchAccounts } = useAccounts();

  useMessageForwarded(
    { targetView: 'main-window', type: 'on-deleted-account' },
    () => {
      fetchAccounts();
    }
  );

  if (localHasFetched && !accounts.length) {
    return <Navigate to="/welcome/getting-started" />;
  }

  return (
    <RequireUnlock>
      <div className={styles.mainWindow}>
        <ErrorBoundary>
          <MainWindowSidebar />
        </ErrorBoundary>
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
    errorElement: <ErrorBoundary />,
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
    errorElement: <ErrorBoundary />,
    element: <MainWrapper />,
    children: [
      {
        path: 'home',
        loader: () => {
          return {
            routeCSSKeyword: 'home_assets',
          } as MainWindowRouteData;
        },
        element: <Home />,
      },
      {
        path: 'home/send-token',
        element: (
          <>
            <FixedBackHeader>Send</FixedBackHeader>
            <SendToken />
          </>
        ),
      },
      {
        path: 'home/swap',
        element: <Swap />,
      },
      {
        path: 'dapps/:origin',
        element: (
          <DappViewWrapper>
            <TopNavBar />
          </DappViewWrapper>
        ),
        loader: () => {
          return {
            floatingAccountComponent: true,
          } as MainWindowRouteData;
        },
      },
      {
        path: 'my-dapps',
        element: <DApps />,
        loader: () => {
          return {
            title: 'My Dapps',
          } as MainWindowRouteData;
        },
      },

      {
        path: 'settings',
        element: <MainWindowSettings />,
        loader: () => {
          return {
            title: 'Settings',
          } as MainWindowRouteData;
        },
      },
    ],
  },
  {
    path: '/unlock',
    errorElement: <ErrorBoundary />,
    element: <Unlock />,
  },
  {
    path: '/import-by',
    id: 'import-by',
    errorElement: <ErrorBoundary />,
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

/**
 * @description make sure use this hooks only once at top-level component in whole app
 */
function useAccountsGuard(nav: (path: string) => void) {
  const { localHasFetched, accounts, fetchAccounts } = useAccounts();

  useEffect(() => {
    if (localHasFetched && !accounts.length) {
      nav('/welcome/getting-started');
    }
  }, [localHasFetched, nav, accounts]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'accountsChanged':
          case 'rabby:chainChanged': {
            fetchAccounts();
          }
        }
      }
    );
  }, [fetchAccounts]);

  return { fetchAccounts };
}

export function MainWindow() {
  useClickMainWindowHideContextMenu();
  useForwardFromInternalPage(router);

  useTransactionChanged();

  useAppUnlockEvents();

  useMainWindowEvents();
  useChromeTabsEvents();

  useMessageForwardToMainwin('route-navigate', (payload) => {
    router.navigate(payload.data);
  });
  useMessageForwardToMainwin('open-dapp', (payload) => {
    window.rabbyDesktop.ipcRenderer
      .invoke('safe-open-dapp-tab', payload.data.dappURL)
      .then(({ shouldNavTabOnClient, openType }) => {
        if (shouldNavTabOnClient) {
          navigateToDappRoute(router.navigate, payload.data.dappURL);
        }
        if (openType === 'create-tab') {
          matomoRequestEvent({
            category: 'My Dapp',
            action: 'Visit Dapp',
            label: payload.data.dappURL,
          });
        }
      });
  });

  useAccountsGuard(router.navigate);
  useMount(() => {
    logGetUserDapp();
  });

  return (
    <>
      <Titlebar />
      <RouterProvider router={router} />
    </>
  );
}
