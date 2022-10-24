import { BrowserWindow } from "electron";
import { firstValueFrom} from "rxjs";

import { IS_RUNTIME_PRODUCTION, RABBY_POPUP_GHOST_VIEW_URL } from "../../isomorphic/constants";
import { NATIVE_HEADER_WITH_NAV_H, SECURITY_ADDRBAR_VIEW_SIZE } from "../../isomorphic/const-size";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { getMainWindow, onMainWindowReady } from "./tabbedBrowserWindow";
import { fromMainSubject, valueToMainSubject } from "./_init";
import { createPopupWindow, hidePopupWindow, showPopupWindow } from "../utils/browser";
import { getOrPutCheckResult } from "../utils/dapps";

const currentPageState: ISecurityAddrbarPopupState = {
  page: 'entry',
}

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    alwaysOnTop: true,
  });

  updateSubWindowPosition(mainWin.window, popupWin);
  const onTargetWinUpdate = () => {
    updateSubWindowPosition(mainWin.window, popupWin);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  await popupWin.webContents.loadURL(`${RABBY_POPUP_GHOST_VIEW_URL}#/security-addressbarpopup`);

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  valueToMainSubject('securityAddressbarPopup', popupWin);
})

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow,
) {
  const [, height] = parentWin.getSize();

  const popupRect = {
    // TODO: use dynamic position
    x: 120,
    y: NATIVE_HEADER_WITH_NAV_H,
    width: SECURITY_ADDRBAR_VIEW_SIZE.width,
    height: Math.min(SECURITY_ADDRBAR_VIEW_SIZE.height, height - NATIVE_HEADER_WITH_NAV_H),
    ...currentPageState.page === 'entry' && {
      height: Math.min(SECURITY_ADDRBAR_VIEW_SIZE.height, height - NATIVE_HEADER_WITH_NAV_H)
    },
    ...currentPageState.page === 'detail-item' && {
      height: Math.min(SECURITY_ADDRBAR_VIEW_SIZE.detailedHeight, height - NATIVE_HEADER_WITH_NAV_H)
    }
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

  window.setBounds({ ...popupRect, x, y }, true)
}

onIpcMainEvent('__internal_rpc:security-addressbarpopup:show', async (_evt, dappUrl) => {
  const targetWin = (await getMainWindow()).window;
  const popupWin = await firstValueFrom(fromMainSubject('securityAddressbarPopup'));

  const checkResult = await getOrPutCheckResult(dappUrl);
  hidePopupWindow(popupWin);

  popupWin.webContents.send('__internal_rpc:security-addressbarpopup:on-show', {
    origin: checkResult.origin,
    checkResult,
  });

  updateSubWindowPosition(targetWin, popupWin);
  showPopupWindow(popupWin)
  popupWin.moveTop();
});

onIpcMainEvent('__internal_rpc:security-addressbarpopup:hide', async () => {
  // const targetWin = (await getMainWindow()).window;
  const popupWin = await firstValueFrom(fromMainSubject('securityAddressbarPopup'));
  hidePopupWindow(popupWin);
});

onIpcMainEvent('__internal_rpc:security-addressbarpopup:switch-pageview', async (evt, payload) => {
  const targetWin = (await getMainWindow()).window;
  const popupWin = await firstValueFrom(fromMainSubject('securityAddressbarPopup'));

  currentPageState.page = payload.page as any;

  updateSubWindowPosition(targetWin, popupWin);

  evt.reply('__internal_rpc:security-addressbarpopup:switch-pageview', {
    state: payload
  });
});
