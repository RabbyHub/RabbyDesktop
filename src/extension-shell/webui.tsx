import React from 'react';
import '@/renderer/css/theme/index.css';

import { createRoot } from 'react-dom/client';

import Topbar from '@/renderer/components/Topbar';

const container = document.getElementById('topbar')!;
const root = createRoot(container);
root.render(<Topbar />);
