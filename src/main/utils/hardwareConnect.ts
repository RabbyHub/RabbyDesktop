import { createWindow } from '../streams/tabbedBrowserWindow';
import { onMainWindowReady } from './stream-helpers';

function getConnectWinSize(
  pWinBounds: Pick<Electron.Rectangle, 'width' | 'height'>
) {
  return {
    width: Math.max(pWinBounds.width - 400, 800),
    height: Math.max(Math.floor(pWinBounds.height * 0.8), 600),
  };
}

function updateSubWindowRect(
  parentWin: Electron.BrowserWindow,
  window: Electron.BrowserWindow
) {
  if (window.isDestroyed()) return;

  const pWinBounds = parentWin.getBounds();
  const popupRect = {
    x: 0,
    y: 0,
    ...getConnectWinSize(pWinBounds),
  };

  window.setSize(popupRect.width, popupRect.height, true);

  // get bounds
  const selfViewBounds = window.getBounds();
  // top-right
  let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width;
  let y = pWinBounds.y + popupRect.y;

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

  const tabbedWin = await createWindow({
    defaultTabUrl: connectURL,
    defaultOpen: false,
    window: {
      parent: mainWindow,
      modal: true,
      center: true,
      type: 'popup',
      ...getConnectWinSize(mainWindow.getBounds()),
      closable: true,
      movable: false,
      minimizable: false,
      maximizable: false,
      resizable: false,
      fullscreenable: false,

      // frame: true,
      // trafficLightPosition: { x: 10, y: 10 }
    },
  });

  const tab = tabbedWin.createTab({
    topbarStacks: {
      tabs: false,
      navigation: false,
    },
  });

  const connWindow = tabbedWin.window;

  // // hook native close button
  // connWindow.on('close', (evt) => {
  //   evt.preventDefault();
  //   tab.destroy();

  //   // TODO: how could we make sure trigger required event on close?
  //   // connWindow.webContents.executeJavaScript('window.close()');

  //   return false;
  // });

  mainWindow.on('close', () => {
    if (connWindow.isDestroyed()) return;
    connWindow?.close();
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