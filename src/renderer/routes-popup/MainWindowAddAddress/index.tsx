import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import { AddAddressModal } from '@/renderer/components/AddAddressModal/AddAddressModal';
import { useResetToCurrentPage } from '@/renderer/components/PopupViewUtils';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';

function App() {
  const resetPage = useResetToCurrentPage();

  return (
    <AddAddressModal
      visible
      onClose={() => {
        hideMainwinPopupview('add-address');
        resetPage();
      }}
    />
  );
}

const router = createRouter([
  {
    path: '/',
    element: (
      <div className={styles.MainWindowAddAddress}>
        <App />
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function MainWindowAddAddress() {
  return <RouterProvider router={router} />;
}
