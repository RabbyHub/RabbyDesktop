/// <reference path="../../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';
import '@/renderer/css/windicss';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import { PopupViewClose, ResetTo } from '@/renderer/components/PopupViewUtils';

import SecurityCheck from '@/renderer/routes-popup/SecurityCheck/SecurityCheck';
import SecurityNotifications from '@/renderer/routes-popup/SecurityNotifications/SecurityNotifications';
import SecurityAddressbarPopup from '@/renderer/routes-popup/SecurityAddressbarPopup/SecurityAddressbarPopup';

import { SidebarContextMenu } from '@/renderer/routes-popup/SidebarContextMenu';
import SwitchChainWindow from '@/renderer/routes-popup/SwitchChainWindow';
import SwitchAccountWindow from '@/renderer/routes-popup/SwitchAccountWindow';

import { parseQueryString } from '@/isomorphic/url';
import RabbyNotificationGasket from '../routes-popup/RabbyNotificationGasket';
import MainWindowAddAddress from '../routes-popup/MainWindowAddAddress';
import QuickSwapWindow from '../routes-popup/QuickSwapWindow';
import MainWindowDappManagement from '../routes-popup/MainWindowDappManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/security-check" element={<SecurityCheck />} />
        <Route
          path="/security-notifications"
          element={<SecurityNotifications />}
        />
        <Route
          path="/security-addressbarpopup"
          element={<SecurityAddressbarPopup />}
        />
        <Route path="/popup__sidebar-dapp" element={<SidebarContextMenu />} />
        <Route path="/popup__switch-chain" element={<SwitchChainWindow />} />
        <Route
          path="/popup__switch-account"
          element={<SwitchAccountWindow />}
        />
        <Route
          path="/popupview__add-address"
          element={<MainWindowAddAddress />}
        />
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
  case 'quick-swap':
    root.render(<QuickSwapWindow />);
    break;
  default:
    root.render(<App />);
    break;
}
