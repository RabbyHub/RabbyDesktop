import classnames from 'classnames';
import { ensureSuffix } from 'isomorphic/string';
import { useMemo } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import IconRabby from '../../assets/icon.svg';
import IconHome from '../../assets/icons/native-tabs/icon-home.svg';
import './App.css';
import useRabbyLoaded from './hooks/useRabbyLoaded';

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
        {/* <Route path="/dapps" element={<DApps />} /> */}
      </Routes>
    </Router>
  );
}
