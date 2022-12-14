import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

import DApps from '@/renderer/routes/Dapps';
import styles from './index.module.less';

import MainRoute from './MainRoute';
import MainWindowSidebar from './Sidebar';

export function MainWindow() {
  return (
    <div className={styles.mainWindow}>
      <Router initialEntries={['/dapps']}>
        <MainWindowSidebar />
        <MainRoute>
          <Routes>
            <Route path="/dapps" element={<DApps />} />
          </Routes>
        </MainRoute>
      </Router>
    </div>
  );
}
