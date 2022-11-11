import { firstValueFrom } from 'rxjs';
import { app } from 'electron';
import { fromMainSubject, valueToMainSubject } from './_init';

import { cLog } from '../utils/log';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { createPopupView } from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { RABBY_PANEL_SIZE, NATIVE_HEADER_WITH_NAV_H } from '../../isomorphic/const-size';
import { walletController } from './rabbyIpcQuery';

export async function getRabbyExtId() {
  const ext = await firstValueFrom(fromMainSubject('rabbyExtension'));

  cLog('getRabbyExtId', ext.id);

  return ext.id;
}

onIpcMainEvent('rabby-extension-id', async (event) => {
  event.reply('rabby-extension-id', {
    rabbyExtensionId: await getRabbyExtId(),
  });
});

onIpcMainEvent('get-app-version', (event, reqid) => {
  event.reply('get-app-version', {
    reqid,
    version: app.getVersion(),
  });
});

async function updateViewPosition(
  rabbyView: Electron.BrowserView,
  mainWin: Electron.BrowserWindow,
) {
  const [width, height] = mainWin.getSize();

  const popupRect = {
    x: width - RABBY_PANEL_SIZE.width,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: RABBY_PANEL_SIZE.width,
    height: height - NATIVE_HEADER_WITH_NAV_H,
  };

  rabbyView.setBounds({ ...popupRect });

  mainWin.setTopBrowserView(rabbyView);
}

getRabbyExtId().then(async (extId) => {
  const tabbedWin = (await onMainWindowReady());
  const mainWin = tabbedWin.window;
  if (mainWin.isDestroyed()) return;

  const rabbyView = createPopupView();
  const rabbyBgHostView = createPopupView();

  mainWin.addBrowserView(rabbyView);
  mainWin.addBrowserView(rabbyBgHostView);

  updateViewPosition(rabbyView, mainWin);

  rabbyBgHostView.setBounds({ x: -9999, y: -1000, width: 1, height: 1 });
  rabbyBgHostView.webContents.loadURL(`chrome-extension://${extId}/background.html`);

  // const bgTab = tabbedWin.createTab({
  //   initialUrl: `chrome-extension://${extId}/background.html`,
  // });
  rabbyBgHostView.webContents.on('did-finish-load', () => {
    valueToMainSubject('rabbyExtBackgroundHost', rabbyBgHostView.webContents!);
  });

  if (!IS_RUNTIME_PRODUCTION) {
    rabbyBgHostView.webContents.openDevTools({ mode: 'detach' });

    rabbyView.webContents.openDevTools({ mode: 'detach' });

    // tabbedWin.createTab({
    //   initialUrl: `https://metamask.github.io/test-dapp/`,
    // }).webContents!
    //   .openDevTools({ mode: 'bottom', activate: false });
  }

  const onTargetWinUpdate = () => {
    updateViewPosition(rabbyView, mainWin);
  }

  mainWin.on('show', onTargetWinUpdate);
  mainWin.on('move', onTargetWinUpdate);
  mainWin.on('resize', onTargetWinUpdate);
  mainWin.on('unmaximize', onTargetWinUpdate);
  mainWin.on('restore', onTargetWinUpdate);

  // wait for extension background initialized.
  setTimeout(() => {
    rabbyView.webContents.loadURL(`chrome-extension://${extId}/popup.html`);
    // rabbyView.webContents.loadURL(`chrome-extension://${extId}/panel.html`);
  }, 5000);

  const isBooted = await walletController.isBooted();
  console.log('[debug] isBooted', isBooted);
});
