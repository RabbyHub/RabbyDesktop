import { createRoot } from 'react-dom/client';
import "../renderer/css/theme/index.css";

import Topbar from './Topbar';

const container = document.getElementById('topbar')!;
const root = createRoot(container);
root.render(<Topbar />);
