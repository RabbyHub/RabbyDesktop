import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import {
  usePopupViewInfo,
  useZPopupCallbackRegistry,
  useZPopupViewStates,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import SwitchChainModal from '../../components/SwitchChainModal';

import styles from './index.module.less';

hideMainwinPopupview('z-popup');

function App() {
  usePopupViewInfo('z-popup', { enableTopViewGuard: true });
  useZPopupCallbackRegistry();

  const { setSvStates } = useZPopupViewStates();

  useMessageForwarded(
    {
      type: 'update-subview-state',
      targetView: 'z-popup',
    },
    (payload) => {
      const { partials } = payload;
      if (!partials) return;

      setSvStates((prev) => ({
        ...prev,
        ...partials,
      }));
    }
  );

  return (
    <>
      <SwitchChainModal />
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
