/// <reference path="preload.d.ts" />

import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './css/style.less';

import DApps from './routes/Dapps';

function App() {
  return (
    <Router initialEntries={['/dapps']}>
      <Routes>
        <Route path="/dapps" element={<DApps />} />
      </Routes>
    </Router>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.rabbyDesktop.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.rabbyDesktop.ipcRenderer.sendMessage('ipc-example', 'ping');
