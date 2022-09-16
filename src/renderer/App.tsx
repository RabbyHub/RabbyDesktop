import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.less';
import DApps from './routes/Dapps';

export default function App() {
  return (
    <Router initialEntries={['/dapps']}>
      <Routes>
        <Route path="/dapps" element={<DApps />} />
      </Routes>
    </Router>
  );
}
