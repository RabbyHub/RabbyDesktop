import { BrowserView, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import { createPopupView, hidePopupView } from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';

const viewsState: Record<
  PopupViewOnMainwinInfo['type'],
  {
    visible: boolean;
  }
> = {
  'add-address': {
    visible: false,
  },
};

async function hidePopupViewOnMainWindow(
  targetView: BrowserView | null,
  type: PopupViewOnMainwinInfo['type']
) {
  if (!targetView || targetView.webContents.isDestroyed()) return;

  // sendToWebContents(
  //   targetView.webContents,
  //   '__internal_push:popupview-on-mainwin:on-visiblechange',
  //   {
  //     type,
  //     visible: false,
  //   }
  // );

  hidePopupView(targetView);
  viewsState[type].visible = false;
}

function updateSubviewPos(
  parentWindow: BrowserWindow,
  view: BrowserView,
  viewRect?: Electron.Point & { width?: number; height?: number }
) {
  const [width, height] = parentWindow.getSize();
  const popupRect = {
    x: 0,
    y: 0,
    width,
    height,
    ...viewRect,
  };

  // Convert to ints
  const x = Math.floor(popupRect.x);
  const y = Math.floor(popupRect.y);

  view.setBounds({ ...popupRect, x, y });
  parentWindow.setTopBrowserView(view);
}

const addAddressReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const addAddressPopup = createPopupView({});

  mainWindow.addBrowserView(addAddressPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['add-address'].visible)
      updateSubviewPos(mainWindow, addAddressPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await addAddressPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=add-address#/popupview__add-address`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addAddressPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addAddressPopup);

  return addAddressPopup;
});

Promise.all([addAddressReady]).then((wins) => {
  valueToMainSubject('popupViewsOnMainwinReady', {
    addAddress: wins[0],
  });
});

onIpcMainEvent(
  '__internal_rpc:popupview-on-mainwin:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { addAddress } = await firstValueFrom(
      fromMainSubject('popupViewsOnMainwinReady')
    );

    const targetView = payload.type === 'add-address' ? addAddress : null;

    if (!targetView) return;

    if (payload.nextShow) {
      viewsState[payload.type].visible = true;
      updateSubviewPos(mainWindow, targetView);
      targetView.webContents.focus();
      // sendToWebContents(
      //   targetView.webContents,
      //   '__internal_push:popupview-on-mainwin:on-visiblechange',
      //   {
      //     type: payload.type,
      //     visible: true,
      //     pageInfo: payload.pageInfo,
      //   }
      // );
      if (
        !IS_RUNTIME_PRODUCTION &&
        payload.openDevTools &&
        !targetView.webContents.isDevToolsOpened()
      ) {
        targetView.webContents.openDevTools({ mode: 'detach' });
      }
    } else {
      hidePopupViewOnMainWindow(targetView, payload.type);
    }
  }
);
