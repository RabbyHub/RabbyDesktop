import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { getMainWindow } from '../streams/tabbedBrowserWindow';

onIpcMainEvent('__internal__rabby:connect', async (_, arg) => {
  const win = await getMainWindow();
  if (win) {
    win.window.webContents.send('__internal__rabby:connect', arg);
  }
});
