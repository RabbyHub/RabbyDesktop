import { ipcMain } from 'electron';
import { getMainWindow } from '../streams/tabbedBrowserWindow';

ipcMain.on('rabby:connect', async (event, arg) => {
  const win = await getMainWindow();
  if (win) {
    win.window.webContents.send('rabby:connect', arg);
  }
});
