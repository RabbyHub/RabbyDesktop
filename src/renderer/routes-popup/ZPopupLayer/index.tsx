import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import {
  usePopupViewInfo,
  useZPopupViewStates,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import {
  hideMainwinPopupview,
  showMainwinPopupview,
} from '@/renderer/ipcRequest/mainwin-popupview';
import TransparentToast from '@/renderer/components/TransparentToast';
import { AddAddressModal } from '@/renderer/components/AddAddressModal/AddAddressModal';
import { AddressManagementModal } from '@/renderer/components/AddressManagementModal/AddressManagementModal';
import { AddressDetailModal } from '@/renderer/components/AddressDetailModal/AddressDetailModal';
import { SelectAddAddressTypeModalInSubview } from '@/renderer/components/SelectAddAddressTypeModal/SelectAddAddressTypeModalInSubview';
import GasketModalLikeWindow from '@/renderer/components/GasketModalLikeWindow';
import { RenameDappModal } from '@/renderer/components/ModalRenameDapp';
import { DeleteDappModal } from '@/renderer/components/ModalDeleteDapp';
import SwitchChainModal from '../../components/SwitchChainModal';

import styles from './index.module.less';

hideMainwinPopupview('z-popup');

function useReactOnZPopupMessage() {
  const { setZViewsState } = useZPopupViewStates();

  useMessageForwarded(
    {
      type: 'update-subview-state',
      targetView: 'z-popup',
    },
    (payload) => {
      const { partials } = payload;
      if (!partials) return;

      setZViewsState((prev) => {
        const nextStates = {
          ...prev,
          ...partials,
        };

        if (Object.values(nextStates).some((v) => v?.visible)) {
          showMainwinPopupview({ type: 'z-popup' });
        } else {
          hideMainwinPopupview('z-popup');
        }

        return nextStates;
      });
    }
  );
}

function App() {
  usePopupViewInfo('z-popup', { enableTopViewGuard: true });
  useReactOnZPopupMessage();

  return (
    <>
      <SwitchChainModal />
      <TransparentToast />
      <AddAddressModal />
      <AddressManagementModal />
      <AddressDetailModal />
      <SelectAddAddressTypeModalInSubview />
      <GasketModalLikeWindow />
      <RenameDappModal />
      <DeleteDappModal />
    </>
  );
}

const router = createRouter([
  {
    path: '/',
    element: (
      <div className={styles.ZPopupLayer}>
        <App />
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function ZPopupLayer() {
  return <RouterProvider router={router} />;
}
