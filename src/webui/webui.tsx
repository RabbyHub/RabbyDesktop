import "../renderer/css/theme/index.css";

// import "./webui-iife";
// import "./Topbar/index.less";

import { createRoot } from 'react-dom/client';

import Topbar from './Topbar';

const container = document.getElementById('topbar')!;
const root = createRoot(container);
root.render(<Topbar />);
