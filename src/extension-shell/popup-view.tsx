/// <reference path="../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';
import '@/renderer/ipcRequest/zPopupMessage';

import { parseQueryString } from '@/isomorphic/url';
import { ShellWalletProvider } from '@/renderer/components/ShellWallet';

import MainWindowAddAddress from '@/renderer/routes-popup/MainWindowAddAddress';
import ZPopupLayer from '@/renderer/routes-popup/ZPopupLayer';
import SelectCameraWindow from '@/renderer/routes-popup/SelectCameraWindow';

const container = document.getElementById('root')!;
const root = createRoot(container);

switch (parseQueryString().view) {
  case 'add-address-dropdown':
    root.render(
      <ShellWalletProvider>
        <MainWindowAddAddress />
      </ShellWalletProvider>
    );
    break;
  case 'z-popup': {
    root.render(
      <ShellWalletProvider>
        <ZPopupLayer />
      </ShellWalletProvider>
    );
    break;
  }
  case 'select-camera': {
    root.render(
      <ShellWalletProvider>
        <SelectCameraWindow />
      </ShellWalletProvider>
    );
    break;
  }
  default:
    throw new Error('Unknown view');
    break;
}
