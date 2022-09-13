import { createRoot } from 'react-dom/client';
import "./css/theme/index.css";

import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.rabbyDesktop.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.rabbyDesktop.ipcRenderer.sendMessage('ipc-example', 'ping');
