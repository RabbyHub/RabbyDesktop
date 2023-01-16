import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';
import { SwapByDex } from './swap';

const router = createRouter([
  {
    path: '/',
    id: 'quick-swap',
    element: (
      <div className={styles.QuickSwapWindow}>
        <GlobalMask
          className={styles.mask}
          onClick={() => {
            hideMainwinPopupview('quick-swap');
            // keep window state, don't reset
          }}
        />
        <div className={styles.container}>
          <SwapByDex />
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function QuickSwapWindow() {
  return <RouterProvider router={router} />;
}
