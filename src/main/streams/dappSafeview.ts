import { BrowserView, BrowserWindow } from 'electron';

import { NativeAppSizes } from '@/isomorphic/const-size-next';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_MAIN_POPUP_VIEW,
} from '../../isomorphic/constants';
import {
  DAPP_SAFE_VIEW_SIZES,
  NATIVE_HEADER_H,
} from '../../isomorphic/const-size-classical';
import { randString } from '../../isomorphic/string';
import { integrateQueryToUrl } from '../../isomorphic/url';

import { createPopupView } from '../utils/browser';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  getDappSafeView,
  getSessionInsts,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import { getAssetPath } from '../utils/app';

function hideView(view: BrowserView, parentWin: BrowserWindow) {
  parentWin.removeBrowserView(view);
}

function isViewHidden(view: BrowserView) {
  const win = BrowserWindow.fromBrowserView(view);
  return !win;
}

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  views: {
    baseView: BrowserView;
    safeView: BrowserView;
  }
) {
  const [width, height] = parentWin.getSize();

  views.baseView.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });

  const safeTopOffset =
    NATIVE_HEADER_H + DAPP_SAFE_VIEW_SIZES.alertHeaderHeight;
  views.safeView.setBounds({
    x: NativeAppSizes.dappsViewLeftOffset,
    y: safeTopOffset,
    width:
      width -
      NativeAppSizes.dappViewPaddingOffsetToSidebar -
      1 /* padding-left */ -
      NativeAppSizes.dappsViewLeftOffset,
    height: height - safeTopOffset,
  });
}

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const baseView = createPopupView({});

  const { dappSafeViewSession } = await getSessionInsts();

  // TODO: stop it interacting with wallet by default
  const safeView = createPopupView({
    webPreferences: {
      session: dappSafeViewSession,
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      preload: getAssetPath(`./preloads/dappSafeViewPreload.js`),
      safeDialogs: true,
      disableDialogs: true,
      devTools: !IS_RUNTIME_PRODUCTION,
    },
  });

  updateSubWindowPosition(mainWin.window, { baseView, safeView });
  const onTargetWinUpdate = () => {
    if (isViewHidden(baseView)) return;
    if (isViewHidden(safeView)) return;
    updateSubWindowPosition(mainWin.window, { baseView, safeView });
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resize', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  baseView.webContents.loadURL(`${RABBY_MAIN_POPUP_VIEW}#/dapp-safe-view`);

  hideView(baseView, targetWin);

  valueToMainSubject('dappSafeModeViews', { baseView, safeView });
});

export async function attachDappSafeview(
  url: string,
  isExisted = false,
  _targetwin?: BrowserWindow
) {
  const dappSafeViewLoadId = randString(6);
  const targetWin = _targetwin || (await onMainWindowReady()).window;
  const { baseView, safeView } = await getDappSafeView();

  sendToWebContents(
    baseView.webContents,
    '__internal_push:dapp-tabs:open-safe-view',
    {
      url,
      isExisted,
      status: 'start-loading',
    }
  );

  targetWin.addBrowserView(baseView);
  targetWin.setTopBrowserView(baseView);
  updateSubWindowPosition(targetWin, { baseView, safeView });

  const targetUrl = integrateQueryToUrl(url, { _dsv_: dappSafeViewLoadId });
  try {
    await safeView.webContents.loadURL(targetUrl);
    sendToWebContents(
      baseView.webContents,
      '__internal_push:dapp-tabs:open-safe-view',
      {
        url,
        isExisted,
        status: 'loaded',
      }
    );
    targetWin.addBrowserView(safeView);
    targetWin.setTopBrowserView(safeView);
  } catch (e) {
    // TODO: deal with potential load failure here
  } finally {
    updateSubWindowPosition(targetWin, { baseView, safeView });
  }
}

onIpcMainEvent('__internal_rpc:dapp-tabs:close-safe-view', async () => {
  const targetWin = (await onMainWindowReady()).window;
  const dappSafeModeViews = await getDappSafeView();

  hideView(dappSafeModeViews.baseView, targetWin);
  hideView(dappSafeModeViews.safeView, targetWin);

  dappSafeModeViews.safeView.webContents.loadURL('about:blank');
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  switch (payload.type) {
    case 'dapp-safe-view:open': {
      attachDappSafeview('https://help.uniswap.org/en', false);
      break;
    }
    case 'dapp-safe-view:inspect': {
      const dappSafeModeViews = await getDappSafeView();
      if (payload.viewType === 'base') {
        dappSafeModeViews.baseView.webContents.openDevTools({
          mode: 'detach',
        });
      } else if (payload.viewType === 'safe') {
        dappSafeModeViews.safeView.webContents.openDevTools({
          mode: 'detach',
        });
      }

      break;
    }
    default:
      break;
  }
});
