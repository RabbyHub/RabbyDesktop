import { NativeAppSizes } from '@/isomorphic/const-size-next';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { RABBY_LOADING_URL } from '../../isomorphic/constants';
import { createPopupView } from '../utils/browser';
import { getDappLoadingView, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import {
  emitIpcMainEvent,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { dappStore, findDappByOrigin } from '../store/dapps';
import { pickMainWindowLayouts } from '../utils/browserView';

const dappTopOffset =
  NativeAppSizes.mainWindowDappTopOffset +
  (process.platform === 'darwin' ? 0 : NativeAppSizes.windowTitlebarHeight);

const currentState = {
  isLoading: false,
};

async function updateViewPosition(
  loadingView: Electron.BrowserView,
  isLoading = currentState.isLoading
) {
  currentState.isLoading = isLoading;

  const tabbedWin = await onMainWindowReady();
  const mainWin = tabbedWin.window;
  const [width, height] = mainWin.getSize();

  const layouts = pickMainWindowLayouts();

  const popupRect = {
    x: layouts.dappsViewLeftOffset,
    y: dappTopOffset,
    width: width - layouts.dappsViewLeftOffset - layouts.dappsViewRightOffset,
    height: height - dappTopOffset - layouts.dappsViewBottomOffset,
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

const dispose = onIpcMainInternalEvent(
  '__internal_main:mainwindow:toggle-loading-view',
  async (payload) => {
    const dappLoadingView = await getDappLoadingView();

    switch (payload.type) {
      case 'show': {
        const dapp = findDappByOrigin(payload.tabURL);
        payload.dapp = dapp;

        updateViewPosition(dappLoadingView, !!dapp);
        break;
      }
      case 'hide': {
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

onIpcMainEvent(
  '__internal_rpc:mainwindow:toggle-loading-view',
  async (_, payload) => {
    dispose.handler(payload);
  }
);

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  switch (payload.type) {
    case 'loading-view:inspect': {
      const loadingView = await getDappLoadingView();
      loadingView.webContents.openDevTools({ mode: 'detach' });
      break;
    }
    default:
      break;
  }
});

onIpcMainInternalEvent(
  '__internal_main:mainwindow:sidebar-collapsed-changed',
  async () => {
    const loadingView = await getDappLoadingView();

    updateViewPosition(loadingView);
  }
);
