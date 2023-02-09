import { createWindow } from '../streams/tabbedBrowserWindow';
import { onMainWindowReady } from './stream-helpers';

function updateSubWindowRect(
  parentWin: Electron.BrowserWindow,
  window: Electron.BrowserWindow,
  windowRect?: Electron.Point & { width?: number; height?: number }
) {
  if (window.isDestroyed()) return;

  const popupRect = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    ...windowRect,
  };

  window.setSize(popupRect.width, popupRect.height, true);

  // get bounds
  const pWinBounds = parentWin.getBounds();
  const selfViewBounds = window.getBounds();

  // top-right
  let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width;
  let y = pWinBounds.y + popupRect.y + /* padding */ 1;

  // Convert to ints
  x = Math.floor(x);
  y = Math.floor(y);

  window.setBounds({ ...popupRect, x, y }, true);
}
/**
 * @description it must be one tabbed window which is:
 *
 * 1. charged by rabbyx extension
 * 2. support chrome.tabs.* APIs
 */
export async function createTrezorLikeConnectPageWindow(connectURL: string) {
  const mainWindow = (await onMainWindowReady()).window;

  const mainBounds = mainWindow.getBounds();

  const tabbedWin = await createWindow({
    defaultTabUrl: connectURL,
    defaultOpen: false,
    window: {
      parent: mainWindow,
      modal: true,
      center: true,
      type: 'popup',
      width: Math.max(mainBounds.width - 400, 800),
      height: Math.max(Math.floor(mainBounds.height * 0.8), 600),
      closable: true,
      movable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      fullscreenable: false,
      skipTaskbar: true,
    },
  });

  const tab = tabbedWin.createTab({
    topbarStacks: {
      tabs: false,
      navigation: false,
    },
  });

  const connWindow = tabbedWin.window;

  connWindow.on('close', () => {
    if (mainWindow.isDestroyed()) return;
    mainWindow?.close();
    // mainWindow.webContents.send('trezor-connect-close');
  });
  updateSubWindowRect(mainWindow, connWindow);
  const onMainWindowUpdate = () => {
    // if (connWindow.isVisible())
    //   hidePopupOnMainWindow(connWindow, 'sidebar-dapp');
    updateSubWindowRect(mainWindow, connWindow);
  };
  mainWindow.on('show', onMainWindowUpdate);
  mainWindow.on('move', onMainWindowUpdate);
  mainWindow.on('resized', onMainWindowUpdate);
  mainWindow.on('unmaximize', onMainWindowUpdate);
  mainWindow.on('restore', onMainWindowUpdate);

  return {
    window: connWindow,
    tab,
  };
}
