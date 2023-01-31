import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import ModalAddDapp from '@/renderer/components/ModalAddDapp';
import styles from './index.module.less';

hideMainwinPopupview('dapps-management');

function DappsManager() {
  const { localVisible, hideView } = usePopupViewInfo('dapps-management');

  if (!localVisible) return null;

  return (
    <div className={styles.MainWindowAddAddress}>
      <ModalAddDapp
        open
        onCancel={() => {
          hideView();
        }}
        onAddedDapp={() => {
          hideView();
        }}
      />
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
