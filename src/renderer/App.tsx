import React, { useMemo } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.less';
import DApps from './routes/Dapps';

function useTabs(rabbyExt: Electron.Extension | null) {
  return useMemo(() => {
    return [].filter(Boolean);
  }, []);
}

export default function App() {
  return (
    <Router initialEntries={['/dapps']}>
      <Routes>
        {/* <Route path="/" element={<DApps />} /> */}
        <Route path="/dapps" element={<DApps />} />
      </Routes>
    </Router>
  );
}
