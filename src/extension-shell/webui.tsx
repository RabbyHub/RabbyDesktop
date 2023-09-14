import '@/renderer/css/theme/index.css';

import { createRoot } from 'react-dom/client';

import './webui.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';
import '@/renderer/utils-shell/webviewTagCreation';
import '@/renderer/ipcRequest/zPopupMessage';

import { MainWindow } from '@/renderer/components/MainWindow';
import Topbar from '@/renderer/components/Topbar';

import { getShellUIType } from '@/isomorphic/url';
import { HardwareConnectTopbar } from '@/renderer/components/HardwareConnectTopbar/HardwareConnectTopbar';
import AlertWindowPrompt from '@/renderer/routes-popup/AlertWindow/Prompt';

const shellUIType = getShellUIType(window.location.href) as IShellWebUIType &
  string;

switch (shellUIType) {
  case 'MainWindow': {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<MainWindow />);
    break;
  }
  case 'Prompt': {
    const container = document.createElement('div');
    container.id = 'root';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<AlertWindowPrompt />);
    break;
  }
  case 'ForTrezorLike': {
    document.documentElement.classList.add('__rabbyx-trezor-like', 'popup-win');

    const container = document.getElementById('topbar')!;
    const root = createRoot(container);
    root.render(<HardwareConnectTopbar />);
    break;
  }
  case 'RabbyX-NotificationWindow': {
    break;
  }
  default: {
    document.documentElement.classList.add(
      '__rabbyx-browser-like',
      'popup-win'
    );

    const container = document.getElementById('topbar')!;
    const root = createRoot(container);
    root.render(<Topbar />);
    break;
  }
}
