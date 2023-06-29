import { useCallback, useEffect } from 'react';
import {
  createHashRouter as createRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import GettingStarted from '@/renderer/routes/Welcome/GettingStarted';
import MainWindowLoading from '@/renderer/routes/MainWindowLoading';
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
import { ErrorBoundary } from '@sentry/react';
import { useMount } from 'ahooks';
import { matomoRequestEvent } from '@/renderer/utils/matomo-request';
import { fetchDapps } from '@/renderer/ipcRequest/dapps';
import dayjs from 'dayjs';
import { useToastMessage } from '@/renderer/hooks/useToastMessage';
import { HomeBundle } from '@/renderer/routes/Bundle';
import { useCustomRPC } from '@/renderer/hooks/useCustomRPC';
import ModalUpdateInHome from '@/renderer/routes/Home/components/ModalUpdate';
import { NFT } from '@/renderer/routes/NFT';
import SendNFT from '@/renderer/routes/SendNFT';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';
import Titlebar from '../Titlebar';
import { TopNavBar } from '../TopNavBar';
import { MainWindowRouteData } from './type';
import { DappViewWrapper } from '../DappView';
import { FixedBackHeader } from '../FixedBackHeader';
import { ShellWalletProvider } from '../ShellWallet';
import TipUnsupportedModal from '../TipUnsupportedModal';

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
  const { isFinishedFetchAccounts, accounts } = useAccounts();
  if (isFinishedFetchAccounts && accounts.length) {
    return <Navigate to="/mainwin/home" />;
  }

  return <Outlet />;
}

function MainWrapper() {
  return (
    <RequireUnlock>
      <div className={styles.mainWindow}>
        <ErrorBoundary>
          <MainWindowSidebar />
        </ErrorBoundary>
        <MainRoute>
          <Outlet />
        </MainRoute>

        <ModalUpdateInHome />
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
    path: '/main-loading',
    loader: () => {
      return {
        routeCSSKeyword: 'mainwin_loading',
      } as MainWindowRouteData;
    },
    element: <MainWindowLoading />,
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
        element: null, // delegate to MainRoute
      },
      {
        path: 'home/bundle',
        element: <HomeBundle />,
      },
      {
        path: 'home/send-token',
        element: (
          <>
            <FixedBackHeader isShowBack={false}>Send</FixedBackHeader>
            <SendToken />
          </>
        ),
      },
      {
        path: 'home/nft',
        element: <NFT />,
        loader: () => {
          return {
            title: 'NFT',
          } as MainWindowRouteData;
        },
      },
      {
        path: 'home/send-nft',
        element: <SendNFT />,
        loader: () => {
          return {
            title: 'Send NFT',
          } as MainWindowRouteData;
        },
      },
      {
        path: 'dapps/:dappId',
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
        path: 'swap',
        element: null, // delegate to MainRoute
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
    element: <Navigate to="/main-loading" />,
  },
]);

/**
 * @description make sure use this hooks only once at top-level component in whole app
 */
function useAccountsGuard() {
  const { fetchAccounts } = useAccounts({
    onFetchStageChanged: useCallback((ctx) => {
      if (ctx.state === 'FINISHED') {
        if (!ctx.accounts.length) {
          router.navigate('/welcome/getting-started');
        } else if (!router.state.location.pathname.startsWith('/mainwin/')) {
          router.navigate('/mainwin/home');
        }
      }
    }, []),
  });

  useMessageForwarded(
    { targetView: 'main-window', type: 'on-deleted-account' },
    () => {
      fetchAccounts();
    }
  );

  useEffect(() => {
    // NOTICE: events wouldn'd trigger on account deleted
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

  useToastMessage();

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

  const { getAllRPC } = useCustomRPC();

  useAccountsGuard();
  useMount(() => {
    logGetUserDapp();
    getAllRPC();
  });

  return (
    <ShellWalletProvider alwaysRender>
      <Titlebar />
      <RouterProvider router={router} />
      <TipUnsupportedModal />
    </ShellWalletProvider>
  );
}
