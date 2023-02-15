import { BrowserView, BrowserWindow } from 'electron';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { valueToMainSubject } from './_init';
import {
  createPopupModalWindow,
  createPopupView,
  hidePopupView,
  showPopupWindow,
} from '../utils/browser';
import {
  getAllMainUIViews,
  getWebuiURLBase,
  onMainWindowReady,
  stopSelectDevices,
} from '../utils/stream-helpers';

const viewsState: Record<
  PopupViewOnMainwinInfo['type'],
  {
    visible: boolean;
    readonly s_isModal?: boolean;
    modalWindow?: BrowserWindow;
  }
> = {
  'add-address': {
    visible: false,
  },
  'address-management': {
    visible: false,
  },
  'dapps-management': {
    visible: false,
  },
  'select-devices': {
    visible: false,
    get s_isModal() {
      return true;
    },
  },
  'z-popup': {
    visible: false,
  },
};

async function hidePopupViewOnWindow(
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

  if (viewsState[type].modalWindow) {
    viewsState[type].modalWindow!.hide();
    viewsState[type].modalWindow!.removeBrowserView(targetView);
    viewsState[type].modalWindow!.destroy();
    viewsState[type].modalWindow = undefined;
  }

  hidePopupView(targetView);
  viewsState[type].visible = false;
}

function updateSubviewPos(parentWindow: BrowserWindow, view: BrowserView) {
  const [width, height] = parentWindow.getSize();
  const popupRect = {
    x: 0,
    y: 0,
    width,
    height,
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

const IS_DARWIN = process.platform === 'darwin';
const SIZE = {
  width: 1000,
  height: 600,
};
async function showModalPopup(
  viewType: PopupViewOnMainwinInfo['type'],
  targetView: BrowserView
) {
  const mainWindow = (await onMainWindowReady()).window;

  const modalWindow = createPopupModalWindow({
    parent: mainWindow,
    ...(IS_DARWIN && {
      ...SIZE,
      center: true,
    }),
  });
  const mainBounds = mainWindow.getBounds();

  modalWindow.setBounds(
    IS_DARWIN
      ? {
          // make it centered
          x: Math.floor((mainBounds.width - SIZE.width) / 2),
          y: Math.floor((mainBounds.height - SIZE.height) / 2),
        }
      : {
          width: mainBounds.width,
          height: mainBounds.height,
          x: mainBounds.x,
          y: mainBounds.y,
        }
  );

  viewsState[viewType].modalWindow = modalWindow;
  modalWindow.addBrowserView(targetView);

  updateSubviewPos(modalWindow, targetView);
  targetView.webContents.focus();

  showPopupWindow(modalWindow);
  modalWindow.focus();

  if (viewType === 'select-devices') {
    modalWindow.on('blur', () => {
      stopSelectDevices();
    });
  }

  return modalWindow;
}

// pointless now
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

  const dappsManagementPopup = createPopupView({});

  mainWindow.addBrowserView(dappsManagementPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['dapps-management'].visible)
      updateSubviewPos(mainWindow, dappsManagementPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await dappsManagementPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=dapps-management#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // dappsManagementPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(dappsManagementPopup);

  return dappsManagementPopup;
});

const selectDevicesReady = onMainWindowReady().then(async () => {
  const selectDevicesPopup = createPopupView({});

  await selectDevicesPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=select-devices#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // selectDevicesPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(selectDevicesPopup);

  return selectDevicesPopup;
});

const zPopupReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const zPopup = createPopupView({});

  mainWindow.addBrowserView(zPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['z-popup'].visible) updateSubviewPos(mainWindow, zPopup);
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await zPopup.webContents.loadURL(
    `${await getWebuiURLBase()}/popup-view.html?view=z-popup#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // zPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(zPopup);

  return zPopup;
});

Promise.all([
  addAddressReady,
  addressManagementReady,
  dappsManagementReady,
  selectDevicesReady,
  zPopupReady,
]).then((wins) => {
  valueToMainSubject('popupViewsOnMainwinReady', {
    addAddress: wins[0],
    addressManagement: wins[1],
    dappsManagement: wins[2],
    selectDevices: wins[3],
    zPopup: wins[4],
  });
});

const { handler } = onIpcMainEvent(
  '__internal_rpc:popupview-on-mainwin:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { views } = await getAllMainUIViews();
    const targetView = views[payload.type] || null;

    if (!targetView) return;

    if (payload.nextShow) {
      viewsState[payload.type].visible = true;
      if (!viewsState[payload.type].s_isModal) {
        updateSubviewPos(mainWindow, targetView);
        targetView.webContents.focus();
      } else {
        showModalPopup(payload.type, targetView);
      }

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
      hidePopupViewOnWindow(targetView, payload.type);
    }
  }
);

onIpcMainInternalEvent(
  '__internal_main:popupview-on-mainwin:toggle-show',
  (payload) => {
    handler(null as any, payload);
  }
);

onIpcMainEvent(
  '__internal_rpc:rabbyx:on-session-broadcast',
  async (_, payload) => {
    const { viewOnlyList } = await getAllMainUIViews();
    viewOnlyList.forEach((webContents) => {
      // forward to main window
      sendToWebContents(
        webContents,
        '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
        payload
      );
    });
  }
);

const { handler: handler2 } = onIpcMainEvent(
  '__internal_forward:views:channel-message',
  async (_, payload) => {
    let views: BrowserView['webContents'][] = [];
    const { hash, list } = await getAllMainUIViews();

    switch (payload.targetView) {
      case '*':
        views = list;
        break;
      case 'main-window':
        views = [hash.mainWindow];
        break;
      case 'add-address':
        views = [hash.addAddress];
        break;
      case 'address-management':
        views = [hash.addressManagement];
        break;
      case 'dapps-management':
        views = [hash.dappsManagement];
        break;
      case 'z-popup':
        views = [hash.zPopup];
        break;
      default: {
        if (!IS_RUNTIME_PRODUCTION) {
          throw new Error(`Unknown targetView: ${(payload as any).targetView}`);
        }
        return;
      }
    }

    views.forEach((webContents) => {
      webContents.send('__internal_forward:views:channel-message', payload);
    });
  }
);

onIpcMainInternalEvent('__internal_main:views:channel-message', (payload) => {
  handler2(null as any, payload);
});
