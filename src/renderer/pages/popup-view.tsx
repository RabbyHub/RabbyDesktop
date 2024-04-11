/// <reference path="../../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';
import '@/renderer/css/windicss';
import '@/renderer/utils/rendererReport';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { PopupViewClose, ResetTo } from '@/renderer/components/PopupViewUtils';

import { SidebarContextMenu } from '@/renderer/routes-popup/SidebarContextMenu';

import SelectDevicesWindow from '@/renderer/routes-popup/SelectDevicesWindow';

import { parseQueryString } from '@/isomorphic/url';
import TopGhostWindow from '@/renderer/routes-popup/TopGhostWindow';
import RightSidePopupWindow from '@/renderer/routes-popup/RightSidePopupWindow';
import RabbyNotificationGasket from '../routes-popup/RabbyNotificationGasket';
import MainWindowDappManagement from '../routes-popup/MainWindowDappManagement';
import DappReadonlyWindow from '../routes-popup/DappReadonlyWindow';
import InDappFindWindow from '../routes-popup/InDappFindWindow';

import GlobalToastPopup from '../components/GlobalToastPopup';
import { initSyncChain } from '../utils/sync-chain';

initSyncChain();

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/popup__sidebar-dapp" element={<SidebarContextMenu />} />
        <Route
          path="/rabby-notification-gasket"
          element={<RabbyNotificationGasket />}
        />
        <Route path="/popupview-reset-to/:resetTo" element={<ResetTo />} />
        <Route path="*" element={<PopupViewClose />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);

switch (parseQueryString().view) {
  case 'dapps-management':
    root.render(<MainWindowDappManagement />);
    break;
  case 'select-devices':
    root.render(<SelectDevicesWindow />);
    break;
  case 'dapp-safe-view':
    root.render(<DappReadonlyWindow />);
    break;
  case 'global-toast-popup':
    root.render(<GlobalToastPopup />);
    break;
  case 'in-dapp-find':
    root.render(<InDappFindWindow />);
    break;
  case 'top-ghost-window':
    root.render(<TopGhostWindow />);
    break;
  case 'right-side-popup':
    root.render(<RightSidePopupWindow />);
    break;
  default:
    root.render(<App />);
    break;
}
