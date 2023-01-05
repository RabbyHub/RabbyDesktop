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
import { dappStore } from '../store/dapps';
import { pickMainWindowLayouts } from '../utils/browserView';

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

onIpcMainInternalEvent(
  '__internal_main:mainwindow:tab-loading-changed',
  async (payload) => {
    switch (payload.type) {
      case 'before-load': {
        const dapps = dappStore.get('dapps') || [];
        const dappOrigin = canoicalizeDappUrl(payload.url).origin;
        const dapp = dapps.find((item) => item.origin === dappOrigin);

        if (dapp) {
          emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
            type: 'start',
            tabId: payload.tabId,
            dapp,
          });
        }
        break;
      }
      case 'did-finish-load': {
        // emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
        //   type: 'did-finish-load',
        //   tabId: payload.tabId,
        // });
        break;
      }
      default:
        break;
    }
  }
);

const dispose = onIpcMainInternalEvent(
  '__internal_main:mainwindow:toggle-loading-view',
  async (payload) => {
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
