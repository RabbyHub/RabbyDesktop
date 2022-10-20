import { app, BrowserWindow, clipboard } from "electron";
import { firstValueFrom, interval, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";
import { NATIVE_HEADER_WITH_NAV_H, SECURITY_NOTIFICATION_VIEW_SIZE } from "../../isomorphic/const-size";
import { cLog } from '../utils/log';
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow, onMainWindowReady } from "./tabbedBrowserWindow";
import { fromMainSubject, valueToMainSubject } from "./_init";

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const secNotifications = new BrowserWindow({
    show: false,
    frame: false,
    parent: mainWin.window,
    movable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    opacity: 0,
    titleBarStyle: 'hidden',
    transparent: true,
    webPreferences: {
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      contextIsolation: true,
    }
  });

  updateSubWindowPosition(mainWin.window, secNotifications);
  targetWin.on('show', () => {
    if (!secNotifications.isVisible()) return ;
    updateSubWindowPosition(mainWin.window, secNotifications);
  })

  targetWin.on('move', () => {
    if (!secNotifications.isVisible()) return ;
    updateSubWindowPosition(mainWin.window, secNotifications);
  })

  await secNotifications.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-notifications`);

  // if (!IS_RUNTIME_PRODUCTION) {
  //   secNotifications.webContents.openDevTools({ mode: 'detach' });
  // }

  // show but opacity is 0
  secNotifications.show();

  valueToMainSubject('securityNotificationsWindowReady', secNotifications);
})

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow,
) {
  const [width, height] = parentWin.getSize();

  const popupRect = {
    x: width - SECURITY_NOTIFICATION_VIEW_SIZE.width,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: SECURITY_NOTIFICATION_VIEW_SIZE.width,
    height: height - NATIVE_HEADER_WITH_NAV_H,
  }

  window.setSize(popupRect.width, popupRect.height);

  // get bounds
  const pWinBounds = parentWin.getBounds()
  const selfViewBounds = window.getBounds()

  // top-right
  let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width
  let y = pWinBounds.y + popupRect.y + /* padding */1

  // Convert to ints
  x = Math.floor(x)
  y = Math.floor(y)

  window.setBounds({ ...selfViewBounds, x, y })
}

export async function attachClipboardSecurityNotificationView (
  web3Addr: string,
  targetWin?: BrowserWindow
) {
  targetWin = targetWin || (await getMainWindow()).window;

  const securityNotifyPopup = await firstValueFrom(fromMainSubject('securityNotificationsWindowReady'));

  securityNotifyPopup.webContents.send('__internal_rpc:clipboard:full-web3-addr', { web3Address: web3Addr });

  onIpcMainEvent('__internal_rpc:clipboard:close-view', () => {
    securityNotifyPopup.setOpacity(0);
  });
  updateSubWindowPosition(targetWin, securityNotifyPopup);
  securityNotifyPopup.setOpacity(1);
}

onIpcMainEvent('__internal_rpc:browser:set-ignore-mouse-events', (event, ...args) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setIgnoreMouseEvents(...args)
})
