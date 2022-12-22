/// <reference path="../../renderer/preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '@/renderer/css/style.less';

import './popup-view.less';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import SecurityCheck from '@/renderer/routes/SecurityCheck/SecurityCheck';
import SecurityNotifications from '@/renderer/routes/SecurityNotifications/SecurityNotifications';
import SecurityAddressbarPopup from '@/renderer/routes/SecurityAddressbarPopup/SecurityAddressbarPopup';
import { SidebarContextMenu } from '@/renderer/components/MainWindow/SidebarContextMenu';
import SwitchChainWindow from '@/renderer/components/ContextMenu/SwitchChainWindow';

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
        <Route
          path="/context-menu-popup__sidebar-dapp"
          element={<SidebarContextMenu />}
        />
        <Route
          path="/context-menu-popup__switch-chain"
          element={<SwitchChainWindow />}
        />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
