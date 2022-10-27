import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { onMainWindowReady } from '../utils/stream-helpers';

onIpcMainEvent('__internal__rabby:connect', async (_, arg) => {
  const win = await onMainWindowReady();
  if (win) {
    win.window.webContents.send('__internal__rabby:connect', arg);
  }
});
