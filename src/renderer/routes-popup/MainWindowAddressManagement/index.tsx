import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import { SelectAddAddressTypeModal } from '@/renderer/components/SelectAddAddressTypeModal/SelectAddAddressTypeModal';
import { AddressManagementDrawer } from '@/renderer/components/AddressManagementDrawer/AddressManagementDrawer';

import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { useIsAddAddress } from '@/renderer/components/AddressManagementDrawer/Footer';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import styles from './index.module.less';

hideMainwinPopupview('address-management');

function AddressMngr() {
  const { localVisible, hideView } = usePopupViewInfo('address-management', {
    enableTopViewGuard: true,
  });
  const { isAddingAddress, setIsAddingAddress } = useIsAddAddress();

  if (!localVisible) return null;

  return (
    <div className={styles.MainWindowAddAddress}>
      <AddressManagementDrawer
        visible
        onClose={() => {
          hideView();
        }}
      />
      <SelectAddAddressTypeModal
        visible={isAddingAddress}
        onClose={() => {
          setIsAddingAddress(false);
        }}
      />
    </div>
  );
}

const router = createRouter([
  {
    path: '/',
    id: 'addr-mngr',
    element: <AddressMngr />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function MainWindowAddressManagement() {
  return <RouterProvider router={router} />;
}
