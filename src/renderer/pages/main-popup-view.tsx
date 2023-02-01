/// <reference path="../preload.d.ts" />

import { createRoot } from 'react-dom/client';
import '../css/style.less';

import './main-popup-view.less';

import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import DappReadonlyModal from '../routes-popup/DappReadonlyModal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dapp-safe-view" element={<DappReadonlyModal />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
