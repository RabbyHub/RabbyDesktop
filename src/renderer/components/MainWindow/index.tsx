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
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';

const router = createRouter([
  {
    path: '/',
    element: <Navigate to="/mainWindow/home" />,
    // element: <Navigate to="/welcome/getting-started" />,
  },
  {
    path: '/welcome',
    id: 'welcome',
    // errorElement: <ErrorBoundary />,
    element: (
      <div className={styles.welcomeScreen}>
        <Outlet />
      </div>
    ),
    // loader: rootLoader,
    children: [
      {
        path: 'getting-started',
        element: <GettingStarted />,
      },
      {
        path: 'add-address',
        element: <>Unimplemented</>,
      },
      {
        path: 'set-password',
        element: <>Unimplemented</>,
      },
    ],
  },
  {
    path: '/mainwin',
    id: 'mainwin',
    // errorElement: <ErrorBoundary />,
    element: (
      <div className={styles.mainWindow}>
        <MainWindowSidebar />
        <MainRoute>
          <Outlet />
        </MainRoute>
      </div>
    ),
    // loader: rootLoader,
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

      await walletController.unlock('qa111111');

      var isUnlocked = await walletController.isBooted();
      console.debug('[debug] MainWindow isUnlocked [2]', isUnlocked);
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

  return <RouterProvider router={router} />;
}
