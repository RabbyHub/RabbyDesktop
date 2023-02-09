import { BrowserView, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { onIpcMainEvent, onIpcMainInternalEvent } from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import {
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
  createPopupView,
  hidePopupView,
} from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';

// async function hidePopupOnMainWindow(
//   targetWin: BrowserWindow | null
// ) {
//   if (!targetWin || targetWin.isDestroyed()) return;

//   hidePopupWindow(targetWin);
// }

// function updateSubWindowRect(
//   parentWin: BrowserWindow,
//   window: BrowserWindow,
//   windowRect?: Electron.Point & { width?: number; height?: number }
// ) {
//   if (window.isDestroyed()) return;

//   const popupRect = {
//     x: 0,
//     y: 0,
//     width: 800,
//     height: 600,
//     ...windowRect,
//   };

//   window.setSize(popupRect.width, popupRect.height);

//   // get bounds
//   const pWinBounds = parentWin.getBounds();
//   const selfViewBounds = window.getBounds();

//   // top-right
//   let x = pWinBounds.x + popupRect.x + popupRect.width - selfViewBounds.width;
//   let y = pWinBounds.y + popupRect.y + /* padding */ 1;

//   // Convert to ints
//   x = Math.floor(x);
//   y = Math.floor(y);

//   window.setBounds({ ...popupRect, x, y }, true);
// }

const viewsState: Record<
  IHardwareConnectPageType,
  {
    visible: boolean;
  }
> = {
  onekey: {
    visible: false,
  },
  trezor: {
    visible: false,
  },
};

async function hidePopupViewOnWindow(
  targetView: BrowserView | null,
  type: IHardwareConnectPageType
) {
  if (!targetView || targetView.webContents.isDestroyed()) return;

  hidePopupView(targetView);
  viewsState[type].visible = false;
}

function updateSubviewPos(
  parentWindow: BrowserWindow,
  view: BrowserView,
  windowRect?: Electron.Point & { width?: number; height?: number }
) {
  const [width, height] = parentWindow.getSize();
  const popupRect = {
    x: -400,
    y: 0,
    width: 800,
    height,
    // ...windowRect,
  };

  // Convert to ints
  const x = Math.floor(popupRect.x);
  const y = Math.floor(popupRect.y);

  view.setBounds({ ...popupRect, x, y });
  if (BrowserWindow.fromBrowserView(view) === parentWindow) {
    parentWindow.setTopBrowserView(view);
  } else if (!IS_RUNTIME_PRODUCTION) {
    console.error('updateSubviewPos: view is not attached to parentWindow!');
  }
}

const hwPopupsReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const promiseList = (['onekey', 'trezor'] as const).map(async (hwType) => {
    const targetPopup = createPopupView({
      // parent: mainWin.window,
      // transparent: false,
      // hasShadow: false,
      // closable: false,
      // alwaysOnTop: true,
      // type: 'popup'
    });

    updateSubviewPos(mainWin.window, targetPopup);
    const onTargetWinUpdate = () => {
      if (viewsState[hwType].visible) {
        hidePopupViewOnWindow(targetPopup, hwType);
      }
    };
    mainWindow.on('show', onTargetWinUpdate);
    mainWindow.on('move', onTargetWinUpdate);
    mainWindow.on('resized', onTargetWinUpdate);
    mainWindow.on('unmaximize', onTargetWinUpdate);
    mainWindow.on('restore', onTargetWinUpdate);

    // targetPopup.on('blur', () => {
    //   emitIpcMainEvent('__internal_main:hardware-connect-popup:toggle-show', {
    //     nextShow: false,
    //     type: hwType
    //   });
    // });

    mainWindow.addBrowserView(targetPopup);

    await targetPopup.webContents.loadURL('about:blank');

    // debug-only
    if (!IS_RUNTIME_PRODUCTION && hwType === 'onekey') {
      // targetPopup.webContents.openDevTools({ mode: 'detach' });
    }

    hidePopupViewOnWindow(targetPopup, hwType);

    return targetPopup;
  });

  return Promise.all(promiseList);
});

hwPopupsReady.then((popups) => {
  valueToMainSubject('hardwareConnectPopup', {
    onekeyPopup: popups[0],
    trezorPopup: popups[1],
  });
});

const { handler } = onIpcMainEvent(
  '__internal_rpc:hardware-connect-popup:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { onekeyPopup, trezorPopup } = await firstValueFrom(
      fromMainSubject('hardwareConnectPopup')
    );
    const targetPopup =
      payload.type === 'onekey'
        ? onekeyPopup
        : payload.type === 'trezor'
        ? trezorPopup
        : null;

    if (!targetPopup) return;

    if (payload.nextShow) {
      updateSubviewPos(mainWindow, targetPopup, {
        x: payload.rect?.x || 0,
        y: payload.rect?.y || 0,
      });

      targetPopup.webContents.loadURL(payload.connectInfo.url);

      if (targetPopup && !IS_RUNTIME_PRODUCTION && payload.openDevTools) {
        targetPopup.webContents.openDevTools({ mode: 'detach' });
      }
    } else {
      hidePopupViewOnWindow(targetPopup, payload.type);
      targetPopup.webContents.loadURL('about:blank');
    }
  }
);

if (!IS_RUNTIME_PRODUCTION) {
  onIpcMainInternalEvent(
    '__internal_main:hardware-connect-popup:toggle-show',
    (payload) => {
      handler(null as any, payload);
    }
  );
}
