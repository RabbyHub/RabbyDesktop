import { BrowserView, BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import { createPopupView, hidePopupView } from '../utils/browser';
import { getWebuiURLBase, onMainWindowReady } from '../utils/stream-helpers';

const viewsState: Record<
  PopupViewOnMainwinInfo['type'],
  {
    visible: boolean;
  }
> = {
  'add-address': {
    visible: false,
  },
  'address-management': {
    visible: false,
  },
  'quick-swap': {
    visible: false,
  },
  'dapps-management': {
    visible: false,
  },
};

async function hidePopupViewOnMainWindow(
  targetView: BrowserView | null,
  type: PopupViewOnMainwinInfo['type']
) {
  if (!targetView || targetView.webContents.isDestroyed()) return;

  sendToWebContents(
    targetView.webContents,
    '__internal_push:popupview-on-mainwin:on-visiblechange',
    {
      type,
      visible: false,
    }
  );

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
    `${await getWebuiURLBase()}/popup-view.html?view=add-address#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addAddressPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addAddressPopup);

  return addAddressPopup;
});

const addressManagementReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const addressManagementPopup = createPopupView({});

  mainWindow.addBrowserView(addressManagementPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['address-management'].visible)
      updateSubviewPos(mainWindow, addressManagementPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await addressManagementPopup.webContents.loadURL(
    `${await getWebuiURLBase()}/popup-view.html?view=address-management#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addressManagementPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addressManagementPopup);

  return addressManagementPopup;
});

const dappsManagementReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const addressManagementPopup = createPopupView({});

  mainWindow.addBrowserView(addressManagementPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['dapps-management'].visible)
      updateSubviewPos(mainWindow, addressManagementPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await addressManagementPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=dapps-management#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addressManagementPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addressManagementPopup);

  return addressManagementPopup;
});

const quickSwapReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const addressManagementPopup = createPopupView({});

  mainWindow.addBrowserView(addressManagementPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['quick-swap'].visible)
      updateSubviewPos(mainWindow, addressManagementPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await addressManagementPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=quick-swap#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addressManagementPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addressManagementPopup);

  return addressManagementPopup;
});

Promise.all([
  addAddressReady,
  addressManagementReady,
  quickSwapReady,
  dappsManagementReady,
]).then((wins) => {
  valueToMainSubject('popupViewsOnMainwinReady', {
    addAddress: wins[0],
    addressManagement: wins[1],
    quickSwap: wins[2],
    dappsManagement: wins[3],
  });
});

onIpcMainEvent(
  '__internal_rpc:popupview-on-mainwin:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { addAddress, addressManagement, quickSwap, dappsManagement } =
      await firstValueFrom(fromMainSubject('popupViewsOnMainwinReady'));

    const targetView =
      payload.type === 'add-address'
        ? addAddress
        : payload.type === 'address-management'
        ? addressManagement
        : payload.type === 'quick-swap'
        ? quickSwap
        : payload.type === 'dapps-management'
        ? dappsManagement
        : null;

    if (!targetView) return;

    if (payload.nextShow) {
      viewsState[payload.type].visible = true;
      updateSubviewPos(mainWindow, targetView);
      targetView.webContents.focus();

      setTimeout(() => {
        sendToWebContents(
          targetView.webContents,
          '__internal_push:popupview-on-mainwin:on-visiblechange',
          {
            type: payload.type,
            visible: true,
            pageInfo: payload.pageInfo,
          }
        );
      }, 50);

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

onIpcMainEvent(
  '__internal_rpc:rabbyx:on-session-broadcast',
  async (_, payload) => {
    const { addAddress, addressManagement, quickSwap, dappsManagement } =
      await firstValueFrom(fromMainSubject('popupViewsOnMainwinReady'));
    [addAddress, addressManagement, quickSwap, dappsManagement].forEach(
      (view) => {
        // forward to main window
        sendToWebContents(
          view.webContents,
          '__internal_push:rabbyx:session-broadcast-forward-to-main',
          payload
        );
      }
    );
  }
);
