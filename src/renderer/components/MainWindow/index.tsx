import {
  createHashRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';

const router = createHashRouter([
  {
    path: '/',
    element: <Navigate to="/home" />,
  },
  {
    path: '/',
    id: 'root',
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
        path: '/home',
        element: <DApps />,
      },
      {
        path: '/swap',
        element: <>Unimplemented Swap</>,
      },
      {
        path: '/dapps/:origin',
        element: <>Dapps Base Outlets</>,
      },
    ],
  },
]);

export function MainWindow() {
  return (
    <RouterProvider router={router} />
    // <div className={styles.mainWindow}>
    //   <MemoryRouter
    //     // initialEntries={['/home']}
    //   >
    //     <MainWindowSidebar />
    //     <MainRoute>
    //       <Routes>
    //         <Route path="/home" element={<DApps />} />
    //         <Route path="/swap" element={<>Unimplemented Swap</>} />
    //         <Route path="/dapps/:origin" element={
    //           <>
    //             Dapps Base Outlets
    //           </>
    //         } />
    //       </Routes>
    //     </MainRoute>
    //   </MemoryRouter>
    // </div>
  );
}
