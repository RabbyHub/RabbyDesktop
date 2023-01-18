import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useTimeoutFn } from 'react-use';

import GlobalMask from '@/renderer/components/MainWindow/GlobalMask';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import styles from './index.module.less';

import { SwapByDex } from './swap';

const RESET_TIMEOUT = 1000 * 60 * 10;

const QuickSwap = () => {
  const [hide, setHide] = useState(false);
  const { localVisible, pageInfo } = usePopupViewInfo('quick-swap');

  console.debug('[feat] pageInfo?.state', pageInfo?.state);

  const [, cancel, reset] = useTimeoutFn(() => {
    window.location.reload();
  }, RESET_TIMEOUT);

  useEffect(() => {
    if (localVisible) {
      cancel();
    } else {
      reset();
    }
  }, [cancel, localVisible, reset]);

  return (
    <div className={styles.QuickSwapWindow}>
      <GlobalMask
        className={styles.mask}
        onClick={() => {
          setHide(true);

          setTimeout(() => {
            hideMainwinPopupview('quick-swap');
            setHide(false);
          }, 150);
          // keep window state, don't reset
        }}
      />
      <div
        className={clsx(
          styles.container,
          localVisible && styles.show,
          hide && styles.hide
        )}
      >
        <SwapByDex quickWindowOpen={localVisible} />
      </div>
    </div>
  );
};

const router = createRouter([
  {
    path: '/',
    id: 'quick-swap',
    element: <QuickSwap />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function QuickSwapWindow() {
  return <RouterProvider router={router} />;
}
