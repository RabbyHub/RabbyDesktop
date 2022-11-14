import { BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';

import { canoicalizeDappUrl, isUrlFromDapp } from '../../isomorphic/url';

import { dappStore, formatDapp } from '../store/dapps';
import { randString } from '../../isomorphic/string';
import { fromMainSubject, valueToMainSubject } from './_init';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import {
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
} from '../utils/browser';
import { getOrPutCheckResult } from '../utils/dapps';
import { onMainWindowReady } from '../utils/stream-helpers';

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow
) {
  if (window.isDestroyed()) return;

  const [width, height] = parentWin.getSize();

  const popupRect = {
    x: 0,
    y: 0,
    width,
    height,
  };

  window.setSize(popupRect.width, popupRect.height);

  // get bounds
  const pWinBounds = parentWin.getBounds();
  const selfViewBounds = window.getBounds();

  // top-right
  let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width;
  let y = pWinBounds.y + popupRect.y + /* padding */ 1;

  // Convert to ints
  x = Math.floor(x);
  y = Math.floor(y);

  window.setBounds({ ...popupRect, x, y }, true);
}

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({ parent: targetWin });

  updateSubWindowPosition(targetWin, popupWin);
  const onTargetWinUpdate = () => {
    updateSubWindowPosition(targetWin, popupWin);
  };

  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resize', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  await popupWin.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/security-check`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  valueToMainSubject('securityCheckPopupWindowReady', popupWin);

  targetWin.on('close', () => {
    popupWin?.close();
  });
});

export async function openDappSecurityCheckView(
  url: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await onMainWindowReady()).window;
  const continualOpId = randString();

  const popupWin = await firstValueFrom(
    fromMainSubject('securityCheckPopupWindowReady')
  );
  updateSubWindowPosition(targetWin, popupWin);

  popupWin.webContents.send('__internal_push:security-check:start-check-dapp', {
    url,
    continualOpId,
  });

  showPopupWindow(popupWin);
  popupWin.moveTop();

  return { continualOpId };
}

onIpcMainEvent('__internal_rpc:security-check:close-view', async () => {
  const popupWin = await firstValueFrom(
    fromMainSubject('securityCheckPopupWindowReady')
  );
  hidePopupWindow(popupWin);
  // const targetWin = (await onMainWindowReady()).window;
  // targetWin.moveTop();
});

onIpcMainEvent('__internal_rpc:security-check:set-view-top', async () => {
  const popupWin = await firstValueFrom(
    fromMainSubject('securityCheckPopupWindowReady')
  );
  popupWin.moveTop();
});

onIpcMainEvent(
  '__internal_rpc:security-check:get-dapp',
  (evt, reqid, dappUrl) => {
    const dapp = dappStore
      .get('dapps')
      .find((item) => item.origin === canoicalizeDappUrl(dappUrl).origin);
    evt.reply('__internal_rpc:security-check:get-dapp', {
      reqid,
      dappInfo: dapp ? formatDapp(dapp) : null,
    });
  }
);

onIpcMainEvent(
  '__internal_rpc:security-check:check-dapp-and-put',
  async (evt, reqid, dappUrl) => {
    if (!isUrlFromDapp(dappUrl)) {
      evt.reply('__internal_rpc:security-check:check-dapp-and-put', {
        reqid,
        result: null,
        error: new Error(`Invalid dapp url: ${dappUrl}`),
      });
    }

    const checkResult = await getOrPutCheckResult(dappUrl, {
      updateOnSet: true,
      wait: true,
    });

    evt.reply('__internal_rpc:security-check:check-dapp-and-put', {
      reqid,
      result: checkResult,
      error: null,
    });
  }
);
