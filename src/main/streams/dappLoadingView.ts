import { NativeAppSizes } from '@/isomorphic/const-size-next';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_LOADING_URL,
} from '../../isomorphic/constants';
import {
  createPopupView,
  isDappViewLoading,
  putDappLoadingViewState,
} from '../utils/browser';
import { getDappLoadingView, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { findDappsByOrigin } from '../store/dapps';
import { pickMainWindowLayouts } from '../utils/browserView';

const dappTopOffset =
  NativeAppSizes.mainWindowDappTopOffset +
  (process.platform === 'darwin' ? 0 : NativeAppSizes.windowTitlebarHeight);

async function updateViewPosition(
  loadingView: Electron.BrowserView,
  isLoading: boolean = isDappViewLoading()
) {
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

  if (!IS_RUNTIME_PRODUCTION) {
    // dappLoadingView.webContents.openDevTools({ mode: 'detach' });
  }

  updateViewPosition(dappLoadingView, false);
});

const dispose = onIpcMainInternalEvent(
  '__internal_main:mainwindow:toggle-loading-view',
  async (payload) => {
    const dappLoadingView = await getDappLoadingView();

    switch (payload.type) {
      case 'show': {
        const findResult = findDappsByOrigin(payload.tabURL);
        const dapp =
          findResult.dappByOrigin || findResult.dappBySecondaryDomainOrigin;
        payload.dapp = dapp;

        putDappLoadingViewState({ loadingTabId: payload.tabId });
        updateViewPosition(dappLoadingView, !!dapp);
        break;
      }
      case 'hide': {
        putDappLoadingViewState({ loadingTabId: -1 });
        updateViewPosition(dappLoadingView, false);
        break;
      }
      default:
        break;
    }
    sendToWebContents(
      dappLoadingView.webContents,
      '__internal_push:mainwindow:toggle-loading-view',
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
