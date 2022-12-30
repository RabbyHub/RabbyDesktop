import { NativeAppSizes } from '@/isomorphic/const-size-next';
import { RABBY_LOADING_URL } from '../../isomorphic/constants';
import { createPopupView } from '../utils/browser';
import { getDappLoadingView, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';

const dappTopOffset =
  NativeAppSizes.mainWindowDappTopOffset +
  (process.platform === 'darwin' ? 0 : NativeAppSizes.windowTitlebarHeight);

async function updateViewPosition(
  loadingView: Electron.BrowserView,
  isLoading = true
) {
  const tabbedWin = await onMainWindowReady();
  const mainWin = tabbedWin.window;
  const [width, height] = mainWin.getSize();

  const popupRect = {
    x: NativeAppSizes.dappsViewLeftOffset,
    y: dappTopOffset,
    width: width - NativeAppSizes.dappsViewLeftOffset,
    height: height - dappTopOffset,
  };

  if (isLoading) {
    loadingView.setAutoResize({ width: true, height: true });
    loadingView.setBounds({ ...popupRect });
    mainWin.setTopBrowserView(loadingView);
  } else {
    loadingView.setAutoResize({ width: false, height: false });
    loadingView.setBounds({
      width: popupRect.width,
      height: 4,
      x: -9999,
      y: -9999,
    });
  }
}

onMainWindowReady().then((tabbedWin) => {
  const mainWindow = tabbedWin.window;
  const dappLoadingView = createPopupView();

  mainWindow.addBrowserView(dappLoadingView);

  dappLoadingView.webContents.loadURL(RABBY_LOADING_URL);

  valueToMainSubject('dappLoadingView', dappLoadingView);

  updateViewPosition(dappLoadingView, false);
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:toggle-loading-view',
  async (_, payload) => {
    const dappLoadingView = await getDappLoadingView();

    switch (payload.type) {
      case 'start': {
        updateViewPosition(dappLoadingView, true);
        break;
      }
      case 'did-finish-load': {
        updateViewPosition(dappLoadingView, false);
        break;
      }
      default:
        break;
    }
    sendToWebContents(
      dappLoadingView.webContents,
      '__internal_push:loading-view:toggle',
      payload
    );
  }
);
