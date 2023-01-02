import { BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import {
  NATIVE_HEADER_WITH_NAV_H,
  SECURITY_NOTIFICATION_VIEW_SIZE,
} from '../../isomorphic/const-size-classical';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import {
  createPopupWindow,
  isPopupWindowHidden,
  showPopupWindow,
} from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow
) {
  if (window.isDestroyed()) return;

  const [width, height] = parentWin.getSize();

  const popupRect = {
    x: width - SECURITY_NOTIFICATION_VIEW_SIZE.width,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: SECURITY_NOTIFICATION_VIEW_SIZE.width,
    height: height - NATIVE_HEADER_WITH_NAV_H,
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

  const popupWin = createPopupWindow({ parent: mainWin.window });

  updateSubWindowPosition(mainWin.window, popupWin);
  const onTargetWinUpdate = () => {
    if (isPopupWindowHidden(popupWin))
      updateSubWindowPosition(mainWin.window, popupWin);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  await popupWin.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/security-notifications`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  popupWin.hide();

  valueToMainSubject('securityNotificationsWindowReady', popupWin);

  // TODO: deal with popupWin close, recreate it as needed
  // targetWin.on('close', () => {
  //   popupWin?.close();
  // });
});

export async function openSecurityNotificationView(
  payload: ISecurityNotificationPayload
) {
  const targetWin = (await onMainWindowReady()).window;
  const popupWin = await firstValueFrom(
    fromMainSubject('securityNotificationsWindowReady')
  );

  sendToWebContents(
    popupWin.webContents,
    '__internal_push:security-notification',
    payload
  );

  updateSubWindowPosition(targetWin, popupWin);

  const pullTop =
    process.platform === 'darwin'
      ? targetWin.isVisible()
      : targetWin.isVisible() && !targetWin.isMinimized();
  showPopupWindow(popupWin, { isInActiveOnDarwin: true });

  if (pullTop) {
    popupWin.moveTop();
  }
}

onIpcMainEvent('__internal_rpc:security-notification:close-view', async () => {
  // const targetWin = (await onMainWindowReady()).window;
  const popupWin = await firstValueFrom(
    fromMainSubject('securityNotificationsWindowReady')
  );
  popupWin.hide();
});

onIpcMainEvent(
  '__internal_rpc:browser:set-ignore-mouse-events',
  (event, ...args) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setIgnoreMouseEvents(...args);
  }
);
