import { BrowserView, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_MAIN_POPUP_VIEW,
} from '../../isomorphic/constants';
import {
  DAPP_SAFE_VIEW_SIZES,
  NATIVE_HEADER_H,
} from '../../isomorphic/const-size';
import { randString } from '../../isomorphic/string';
import { integrateQueryToUrl, parseQueryString } from '../../isomorphic/url';

import { createPopupView } from '../utils/browser';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { onMainWindowReady } from '../utils/stream-helpers';
import { fromMainSubject, valueToMainSubject } from './_init';

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
    x: DAPP_SAFE_VIEW_SIZES.horizontalPadding,
    y: safeTopOffset,
    width:
      width - DAPP_SAFE_VIEW_SIZES.horizontalPadding * 2 - 1 /* padding-left */,
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

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // baseView.webContents.openDevTools({ mode: 'detach' });
    // setTimeout(() => {
    //   attachAlertBrowserView('https://help.uniswap.org/en', false);
    // }, 1000);
  }

  targetWin.removeBrowserView(baseView);

  valueToMainSubject('dappSafeModeViews', { baseView, safeView });
});

export async function attachAlertBrowserView(
  url: string,
  isExisted = false,
  _targetwin?: BrowserWindow
) {
  const dappSafeViewLoadId = randString(6);
  const targetWin = _targetwin || (await onMainWindowReady()).window;
  const { baseView, safeView } = await firstValueFrom(
    fromMainSubject('dappSafeModeViews')
  );

  baseView.webContents.send('__internal_rpc:dapp-tabs:open-safe-view', {
    url,
    isExisted,
    status: 'start-loading',
  });

  if (!IS_RUNTIME_PRODUCTION && !safeView.webContents.isDevToolsOpened()) {
    // safeView.webContents.openDevTools({ mode: 'detach' });
  }

  targetWin.addBrowserView(baseView);
  targetWin.setTopBrowserView(baseView);

  const targetUrl = integrateQueryToUrl(url, { _dsv_: dappSafeViewLoadId });
  try {
    await safeView.webContents.loadURL(targetUrl);
    baseView.webContents.send('__internal_rpc:dapp-tabs:open-safe-view', {
      url,
      isExisted,
      status: 'loaded',
    });
    targetWin.addBrowserView(safeView);
    targetWin.setTopBrowserView(safeView);
  } catch (e) {
    // TODO: deal with potenntial load failure here
  } finally {
    updateSubWindowPosition(targetWin, { baseView, safeView });
  }
}

onIpcMainEvent('__internal_rpc:dapp-tabs:close-safe-view', async () => {
  const targetWin = (await onMainWindowReady()).window;
  const dappSafeModeViews = await firstValueFrom(
    fromMainSubject('dappSafeModeViews')
  );

  targetWin.removeBrowserView(dappSafeModeViews.safeView);
  targetWin.removeBrowserView(dappSafeModeViews.baseView);
  dappSafeModeViews.safeView.webContents.loadURL('about:blank');
});
