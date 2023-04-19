/// <reference path="../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';
import '@/renderer/ipcRequest/zPopupMessage';

import { parseQueryString } from '@/isomorphic/url';

import MainWindowAddAddress from '@/renderer/routes-popup/MainWindowAddAddress';
import ZPopupLayer from '@/renderer/routes-popup/ZPopupLayer';
import { RabbyShellProvider } from '@/renderer/hooks-shell/useShellWallet';

const container = document.getElementById('root')!;
const root = createRoot(container);

switch (parseQueryString().view) {
  case 'add-address-dropdown':
    root.render(
      <RabbyShellProvider>
        <MainWindowAddAddress />
      </RabbyShellProvider>
    );
    break;
  case 'z-popup': {
    root.render(
      <RabbyShellProvider>
        <ZPopupLayer />
      </RabbyShellProvider>
    );
    break;
  }
  default:
    throw new Error('Unknown view');
    break;
}
