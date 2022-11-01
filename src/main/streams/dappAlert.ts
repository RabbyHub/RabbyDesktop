import { BrowserView, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';
import { IS_RUNTIME_PRODUCTION, RABBY_MAIN_POPUP_VIEW } from '../../isomorphic/constants';
import { createPopupView } from '../utils/browser';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { onMainWindowReady } from '../utils/stream-helpers';
import { fromMainSubject, valueToMainSubject } from './_init';

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  dappSafeModeView: BrowserView
) {
  const [width, height] = parentWin.getSize();

  // get bounds
  const selfViewBounds = dappSafeModeView.getBounds();

  dappSafeModeView.setBounds({
    ...selfViewBounds,
    x: 0,
    y: 0,
    width,
    height,
  });
}

onMainWindowReady().then((mainWin) => {
  const targetWin = mainWin.window;

  const popupView = createPopupView({
    webPreferences: {
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
    }
  });

  updateSubWindowPosition(mainWin.window, popupView);
  const onTargetWinUpdate = () => {
    updateSubWindowPosition(mainWin.window, popupView);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  popupView.webContents.loadURL(`${RABBY_MAIN_POPUP_VIEW}#/dapp-safe-view`);

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    popupView.webContents.openDevTools({ mode: 'detach' });
  }

  targetWin.removeBrowserView(popupView);

  valueToMainSubject('dappSafeModeView', popupView);
});

export async function attachAlertBrowserView(
  url: string,
  isExisted = false,
  _targetwin?: BrowserWindow
) {
  const targetWin = _targetwin || (await onMainWindowReady()).window;
  const dappSafeModeView = await firstValueFrom(fromMainSubject('dappSafeModeView'));

  targetWin.addBrowserView(dappSafeModeView);
  updateSubWindowPosition(targetWin, dappSafeModeView);

  dappSafeModeView.webContents.send('__internal_rpc:dapp-tabs:open-safe-view', {
    url,
    isExisted,
  });
  targetWin.setTopBrowserView(dappSafeModeView);
}

onIpcMainEvent('__internal_rpc:dapp-tabs:close-safe-view', async () => {
  const targetWin = (await onMainWindowReady()).window;
  const dappSafeModeView = await firstValueFrom(fromMainSubject('dappSafeModeView'));
  targetWin.removeBrowserView(dappSafeModeView);
});
