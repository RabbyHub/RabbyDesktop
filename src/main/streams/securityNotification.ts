import { BrowserWindow } from "electron";
import { firstValueFrom} from "rxjs";

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";
import { NATIVE_HEADER_WITH_NAV_H, SECURITY_NOTIFICATION_VIEW_SIZE } from "../../isomorphic/const-size";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow, onMainWindowReady } from "./tabbedBrowserWindow";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { createPopupWindow } from "../utils/browser";


onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({ parent: mainWin.window });

  updateSubWindowPosition(mainWin.window, popupWin);
  targetWin.on('show', () => {
    // if (!popupWin.isVisible()) return ;
    updateSubWindowPosition(mainWin.window, popupWin);
  })

  targetWin.on('move', () => {
    // if (!popupWin.isVisible()) return ;
    updateSubWindowPosition(mainWin.window, popupWin);
  })

  await popupWin.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-notifications`);

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  popupWin.hide();
  popupWin.setOpacity(0);

  valueToMainSubject('securityNotificationsWindowReady', popupWin);

  // TODO: deal with popupWin close, recreate it as needed
  // targetWin.on('close', () => {
  //   popupWin?.close();
  // });
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

export async function openSecurityNotificationView (payload: ISecurityNotificationPayload) {
  const targetWin = (await getMainWindow()).window;
  const popupWin = await firstValueFrom(fromMainSubject('securityNotificationsWindowReady'));

  popupWin.webContents.send('__internal_rpc:security-notification', payload);

  updateSubWindowPosition(targetWin, popupWin);
  popupWin.show();
  popupWin.setOpacity(1);
  popupWin.moveTop();
}

onIpcMainEvent('__internal_rpc:clipboard:close-view', async () => {
  // const targetWin = (await getMainWindow()).window;
  const popupWin = await firstValueFrom(fromMainSubject('securityNotificationsWindowReady'));
  popupWin.setOpacity(0);
  popupWin.hide();
});

onIpcMainEvent('__internal_rpc:browser:set-ignore-mouse-events', (event, ...args) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.setIgnoreMouseEvents(...args)
})
