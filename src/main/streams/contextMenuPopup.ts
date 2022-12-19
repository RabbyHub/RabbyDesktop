import { app, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import {
  NATIVE_HEADER_WITH_NAV_H,
  SECURITY_ADDRBAR_VIEW_SIZE,
} from '../../isomorphic/const-size-classical';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import {
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
} from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow,
  triggerPoint?: Electron.Point
) {
  if (window.isDestroyed()) return;

  const [, height] = parentWin.getSize();

  const popupRect = {
    // TODO: use dynamic position
    x: 5,
    y: 5,
    ...triggerPoint,
    width: SECURITY_ADDRBAR_VIEW_SIZE.width,
    height: Math.min(
      SECURITY_ADDRBAR_VIEW_SIZE.height,
      height - NATIVE_HEADER_WITH_NAV_H
    ),
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

  const popupWin = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
  });

  updateSubWindowPosition(mainWin.window, popupWin);
  const onTargetWinUpdate = () => {
    // updateSubWindowPosition(mainWin.window, popupWin);
    hidePopupWindow(popupWin);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(popupWin);
  });

  mainWin.window.on('focus', () => {
    console.debug('[debug] main window focused');
    hidePopupWindow(popupWin);
  });

  await popupWin.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/context-menu-popup`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  valueToMainSubject('contextMenuPopupWindowReady', popupWin);
});

onIpcMainEvent(
  '__internal_rpc:context-meunu-popup:toggle-show',
  async (_evt, payload) => {
    const targetWin = (await onMainWindowReady()).window;
    const popupWin = await firstValueFrom(
      fromMainSubject('contextMenuPopupWindowReady')
    );

    if (payload.nextShow) {
      updateSubWindowPosition(targetWin, popupWin, {
        x: payload.pos.x,
        y: payload.pos.y,
      });
      showPopupWindow(popupWin);
    } else {
      hidePopupWindow(popupWin);
    }
  }
);
