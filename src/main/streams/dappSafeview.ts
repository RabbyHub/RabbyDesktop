import { BrowserView, BrowserWindow } from 'electron';

import { NativeAppSizes } from '@/isomorphic/const-size-next';
import { RABBY_MAIN_POPUP_VIEW } from '../../isomorphic/constants';
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
import { getDappSafeView, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';

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
    x:
      DAPP_SAFE_VIEW_SIZES.horizontalPadding +
      NativeAppSizes.dappsViewLeftOffset,
    y: safeTopOffset,
    width:
      width -
      DAPP_SAFE_VIEW_SIZES.horizontalPadding * 2 -
      1 /* padding-left */ -
      NativeAppSizes.dappsViewLeftOffset,
    height: height - safeTopOffset,
  });
}

onMainWindowReady().then((mainWin) => {
  const targetWin = mainWin.window;

  const baseView = createPopupView({});

  // TODO: stop it interacting with wallet by default
  const safeView = createPopupView({
    webPreferences: {
      sandbox: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
    },
  });

  updateSubWindowPosition(mainWin.window, { baseView, safeView });
  const onTargetWinUpdate = () => {
    updateSubWindowPosition(mainWin.window, { baseView, safeView });
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resize', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  baseView.webContents.loadURL(`${RABBY_MAIN_POPUP_VIEW}#/dapp-safe-view`);

  targetWin.removeBrowserView(baseView);

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

  targetWin.removeBrowserView(dappSafeModeViews.safeView);
  targetWin.removeBrowserView(dappSafeModeViews.baseView);
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
