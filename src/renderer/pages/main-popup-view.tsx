/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './main-popup-view.less';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import DappSafeView from '../routes/DappSafeView/DappSafeView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dapp-safe-view" element={<DappSafeView />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

