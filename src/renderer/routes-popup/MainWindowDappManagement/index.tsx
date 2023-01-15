import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Modal as RModal } from '@/renderer/components/Modal/Modal';
import styles from './index.module.less';

hideMainwinPopupview('dapps-management');

function DappsManager() {
  const { localVisible, hideView } = usePopupViewInfo('dapps-management');

  if (!localVisible) return null;

  return (
    <div className={styles.MainWindowAddAddress}>
      <RModal
        open
        onCancel={() => {
          hideView();
        }}
      >
        <div className={styles.content}>Click Close To Hide View.</div>
      </RModal>
    </div>
  );
}

const router = createRouter([
  {
    path: '/',
    id: 'dapps-mngr',
    element: <DappsManager />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function MainWindowDappManagement() {
  return <RouterProvider router={router} />;
}
