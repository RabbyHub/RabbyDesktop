import '@/renderer/css/theme/index.css';

import { createRoot } from 'react-dom/client';

import './webui.less';

import { MainWindow } from '@/renderer/components/MainWindow';
import Topbar from '@/renderer/components/Topbar';

import {
  isMainWinShellWebUI,
  isRabbyXNotificationWinShellWebUI,
} from '@/isomorphic/url';

if (isMainWinShellWebUI(window.location.href)) {
  const container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
  // const container = document.getElementById('root')!;
  const root = createRoot(container);
  root.render(<MainWindow />);
} else if (!isRabbyXNotificationWinShellWebUI(window.location.href)) {
  document.body.classList.add('popup-win');
  const container = document.getElementById('topbar')!;
  const root = createRoot(container);
  root.render(<Topbar />);
}
