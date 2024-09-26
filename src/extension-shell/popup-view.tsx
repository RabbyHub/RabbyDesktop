/// <reference path="../renderer/preload.d.ts" />

import '@/renderer/css/style.less';
import { createRoot } from 'react-dom/client';

import '@/renderer/css/windicss';
import '@/renderer/ipcRequest/zPopupMessage';
import '@/renderer/utils/rendererReport';
import './popup-view.less';

import { parseQueryString } from '@/isomorphic/url';
import { ShellWalletProvider } from '@/renderer/components/ShellWallet';

import SelectCameraWindow from '@/renderer/routes-popup/SelectCameraWindow';
import ZPopupLayer from '@/renderer/routes-popup/ZPopupLayer';

import '@/renderer/utils/i18n';

const container = document.getElementById('root')!;
const root = createRoot(container);

switch (parseQueryString().view) {
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
