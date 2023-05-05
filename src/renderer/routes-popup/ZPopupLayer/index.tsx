import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import {
  usePopupViewInfo,
  useZViewStates,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import {
  forwardMessageTo,
  useMessageForwarded,
} from '@/renderer/hooks/useViewsMessage';
import {
  hideMainwinPopupview,
  showMainwinPopupview,
} from '@/renderer/ipcRequest/mainwin-popupview';
import TransparentToast, {
  ToastZPopupMessage,
} from '@/renderer/components/TransparentToast';
import { AddAddressModal } from '@/renderer/components/AddAddressModal/AddAddressModal';
import { AddressManagementModal } from '@/renderer/components/AddressManagementModal/AddressManagementModal';
import { AddressDetailModal } from '@/renderer/components/AddressDetailModal/AddressDetailModal';
import { SelectAddAddressTypeModalInSubview } from '@/renderer/components/SelectAddAddressTypeModal/SelectAddAddressTypeModalInSubview';
import GasketModalLikeWindow from '@/renderer/components/GasketModalLikeWindow';
import { RenameDappModal } from '@/renderer/components/ModalRenameDapp';
import { DeleteDappModal } from '@/renderer/components/ModalDeleteDapp';
import { pickVisibleFromZViewStates } from '@/renderer/utils/zviews';
import { QueueModal } from '@/renderer/components/QueueModal/QueueModal';
import {
  IPFSAddFailedModal,
  IPFSNoLodalModal,
  IPFSVerifyFailedModal,
  DappTypeNotSupportedModal,
} from '@/renderer/components/IPFSAlertModal';
import { useTipCannotUseTrezorLike } from '@/renderer/hooks-shell/useZPopupEffects';
import { TxToast } from '@/renderer/components/TxToast';
import SwitchChainModal from '../../components/SwitchChainModal';

import styles from './index.module.less';

hideMainwinPopupview('z-popup');

function useReactOnZPopupMessage() {
  const { setZViewsState } = useZViewStates();

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
        } as NullableFields<IZPopupSubviewState>;

        forwardMessageTo('main-window', 'z-views-visible-changed', {
          nextVisibles: pickVisibleFromZViewStates(nextStates),
        });

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

  useTipCannotUseTrezorLike();

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
      <QueueModal />
      <ToastZPopupMessage />
      <IPFSAddFailedModal />
      <IPFSNoLodalModal />
      <IPFSVerifyFailedModal />
      <DappTypeNotSupportedModal />
      <TxToast />
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
