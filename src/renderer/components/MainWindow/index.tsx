import {
  createMemoryRouter as createRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import GettingStarted from '@/renderer/routes/Welcome/GettingStarted';
import { useEffect, useLayoutEffect } from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { hideContextMenuPopup } from '@/renderer/ipcRequest/contextmenu-popup';
import ImportHome from '@/renderer/routes/Import/ImportHome';
import ImportByPrivateKey from '@/renderer/routes/ImportBy/ImportByPrivateKey';
import ImportSetPassword from '@/renderer/routes/Import/ImportSetPassword';
import ImportSuccessful from '@/renderer/routes/Import/ImportSuccessful';
import ImportByContainer from '@/renderer/routes/ImportBy/ImportByContainer';
import { Unlock } from '@/renderer/routes/Unlock/Unlock';
import { RequireUnlock } from '@/renderer/routes/RequireUnlock';
import { useForwardFromInternalPage } from '@/renderer/hooks-shell/useMainWindow';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';
import Titlebar from '../Titlebar';

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
        element: <DApps />,
      },
      {
        path: 'swap',
        element: <>Unimplemented Swap</>,
      },
      {
        path: 'dapps/:origin',
        element: <>Dapps Base Outlets</>,
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
  useEffect(() => {
    /* eslint-disable */
    // TODO: remove this on production, this is just for testing & communicating
    (async () => {
      var isUnlocked = await walletController.isUnlocked();
      console.debug('[debug] MainWindow isUnlocked', isUnlocked);

      const isBooted = await walletController.isBooted();
      console.debug('[debug] MainWindow isBooted', isBooted);

      // await walletController.unlock('qa111111');
      // var isUnlocked = await walletController.isUnlocked();
      // console.debug('[debug] MainWindow isUnlocked [2]', isUnlocked);

      console.debug(
        '[debug] MainWindow walletController.boot',
        walletController.boot
      );
      console.debug(
        '[debug] MainWindow walletController.lockWallet',
        walletController.lockWallet
      );
      console.debug(
        '[debug] MainWindow walletController.importPrivateKey',
        walletController.importPrivateKey
      );
    })();
    /* eslint-enable */
  }, []);

  useLayoutEffect(() => {
    const listener = () => {
      hideContextMenuPopup();
    };
    document.body.addEventListener('click', listener);

    return () => {
      document.body.removeEventListener('click', listener);
    };
  }, []);

  useForwardFromInternalPage(router);

  return (
    <>
      <Titlebar />
      <RouterProvider router={router} />
    </>
  );
}
