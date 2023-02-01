import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import DappReadonlyModal from './DappReadonlyModal';

const router = createRouter([
  {
    path: '/',
    element: <DappReadonlyModal />,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

export default function DappReadonlyWindow() {
  useBodyClassNameOnMounted('dapp-safe-view');

  return <RouterProvider router={router} />;
}
