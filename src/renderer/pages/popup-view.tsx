/// <reference path="../../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import SecurityCheck from '@/renderer/routes-popup/SecurityCheck/SecurityCheck';
import SecurityNotifications from '@/renderer/routes-popup/SecurityNotifications/SecurityNotifications';
import SecurityAddressbarPopup from '@/renderer/routes-popup/SecurityAddressbarPopup/SecurityAddressbarPopup';
import { SidebarContextMenu } from '@/renderer/routes-popup/SidebarContextMenu';
import SwitchChainWindow from '@/renderer/routes-popup/SwitchChainWindow';
import SwitchAccountWindow from '@/renderer/routes-popup/SwitchAccountWindow';
import RabbyNotificationGasket from '../routes-popup/RabbyNotificationGasket';

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
          path="/rabby-notification-gasket"
          element={<RabbyNotificationGasket />}
        />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
