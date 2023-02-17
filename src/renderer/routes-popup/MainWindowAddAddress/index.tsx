import {
  createHashRouter as createRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import AddAddressDropdown from '@/renderer/components/AddAddressDropdown';
import { css, createGlobalStyle } from 'styled-components';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import styles from './index.module.less';

const Gasket = createGlobalStyle`
  html {
    ${
      !IS_RUNTIME_PRODUCTION &&
      css`
        background: rgba(var(--color-primary-rgb), 0.3);
      `
    }
  }
`;

function App() {
  useBodyClassNameOnMounted('add-address-popup');
  return (
    <>
      <Gasket />
      <AddAddressDropdown />
    </>
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
