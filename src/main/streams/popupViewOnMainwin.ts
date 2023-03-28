import { BrowserView, BrowserWindow } from 'electron';

import { roundRectValue } from '@/isomorphic/shape';
import { InDappFindSizes } from '@/isomorphic/const-size-next';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import {
  emitIpcMainEvent,
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
} from '../utils/stream-helpers';
import { getMainWindowTopOffset } from '../utils/browserView';
import type { MainWindowTab } from '../browser/tabs';

const viewsState: Record<
  PopupViewOnMainwinInfo['type'],
  {
    visible: boolean;
    readonly s_isModal?: boolean;
    modalWindow?: BrowserWindow;
  }
> = {
  'add-address-dropdown': {
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
  'in-dapp-find': {
    visible: false,
  },
  'z-popup': {
    visible: false,
  },
  'global-toast-popup': {
    visible: false,
  },
};

async function hidePopupViewOnWindow(
  targetView: BrowserView,
  type: PopupViewOnMainwinInfo['type']
) {
  sendToWebContents(
    targetView.webContents,
    '__internal_push:popupview-on-mainwin:on-visiblechange',
    {
      type,
      visible: false,
    }
  );

  if (targetView.webContents.isDestroyed()) return;

  if (viewsState[type].modalWindow) {
    viewsState[type].modalWindow!.hide();
    viewsState[type].modalWindow!.removeBrowserView(targetView);
    viewsState[type].modalWindow!.destroy();
    viewsState[type].modalWindow = undefined;
  }

  hidePopupView(targetView);
  viewsState[type].visible = false;
}

function updateSubviewPos(
  parentWindow: BrowserWindow,
  view: BrowserView,
  viewType?: PopupViewOnMainwinInfo['type'] | Electron.Rectangle
) {
  const [width, height] = parentWindow.getSize();
  let popupRect = {
    x: 0,
    y: 0,
    width,
    height,
  };

  if (viewType === 'add-address-dropdown') {
    const selfBounds = view.getBounds();

    popupRect = {
      ...popupRect,
      ...selfBounds,
    };
  } else if (viewType === 'global-toast-popup') {
    popupRect.width = 600;
    popupRect = {
      ...popupRect,
      height: 80,
      // make it h-center
      x: Math.floor((width - popupRect.width) / 2),
      y: getMainWindowTopOffset(),
    };
  } else if (typeof viewType === 'object') {
    popupRect = {
      ...popupRect,
      ...viewType,
    };
  }

  roundRectValue(popupRect);

  view.setBounds(popupRect);
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
      sendToWebContents(
        targetView.webContents,
        '__internal_push:webhid:select-devices-modal-blur',
        {}
      );
    });
  }

  return modalWindow;
}

const addAddressReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const addAddressPopup = createPopupView({});

  mainWindow.addBrowserView(addAddressPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['add-address-dropdown'].visible)
      updateSubviewPos(mainWindow, addAddressPopup, 'add-address-dropdown');
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await addAddressPopup.webContents.loadURL(
    `${await getWebuiURLBase()}/popup-view.html?view=add-address-dropdown#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // addAddressPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(addAddressPopup);

  return addAddressPopup;
});

const dappsManagementReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const dappsManagementPopup = createPopupView({});

  mainWindow.addBrowserView(dappsManagementPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['dapps-management'].visible)
      updateSubviewPos(mainWindow, dappsManagementPopup, 'dapps-management');
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

const inDappFindReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const inDappFindPopup = createPopupView({});

  mainWindow.addBrowserView(inDappFindPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['in-dapp-find'].visible) {
      const oldBounds = inDappFindPopup.getBounds();
      updateSubviewPos(mainWindow, inDappFindPopup, oldBounds);
    }
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await inDappFindPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=in-dapp-find`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    inDappFindPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(inDappFindPopup);

  return inDappFindPopup;
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

const globalToastPopupReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const globalToastPopup = createPopupView({});

  mainWindow.addBrowserView(globalToastPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['global-toast-popup'].visible)
      updateSubviewPos(mainWindow, globalToastPopup, 'global-toast-popup');
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await globalToastPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=global-toast-popup#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // globalToastPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(globalToastPopup);

  return globalToastPopup;
});

Promise.all([
  addAddressReady,
  dappsManagementReady,
  selectDevicesReady,
  inDappFindReady,
  zPopupReady,
  globalToastPopupReady,
]).then((wins) => {
  valueToMainSubject('popupViewsOnMainwinReady', {
    addAddress: wins[0],
    dappsManagement: wins[1],
    selectDevices: wins[2],
    inDappFind: wins[3],
    zPopup: wins[4],
    globalToastPopup: wins[5],
  });
});

const { handler } = onIpcMainInternalEvent(
  '__internal_main:popupview-on-mainwin:toggle-show',
  async (payload) => {
    const mainTabbedWin = await onMainWindowReady();
    const mainWindow = mainTabbedWin.window;
    const { views } = await getAllMainUIViews();
    const targetView = views[payload.type] || null;

    if (!targetView) return;

    if (payload.nextShow) {
      if (payload.type !== 'in-dapp-find') {
        emitIpcMainEvent('__internal_main:mainwindow:op-find-in-page', {
          type: 'stop-find',
        });
      }

      viewsState[payload.type].visible = true;
      if (!viewsState[payload.type].s_isModal) {
        if (payload.type === 'add-address-dropdown') {
          updateSubviewPos(
            mainWindow,
            targetView,
            (payload.pageInfo as any).triggerRect
          );
        } else if (payload.type === 'in-dapp-find') {
          const tabOrigin = (payload.pageInfo as any).searchInfo.tabOrigin;

          updateSubviewPos(mainWindow, targetView, {
            ...InDappFindSizes,
            x: tabOrigin.x,
            y: tabOrigin.y,
          });
        } else {
          updateSubviewPos(mainWindow, targetView, payload.type);
        }
        targetView.webContents.focus();
      } else {
        await showModalPopup(payload.type, targetView);
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
      if (payload.type === 'in-dapp-find') {
        mainTabbedWin.tabs.selected?.view?.webContents.focus();
      }
      hidePopupViewOnWindow(targetView, payload.type);
    }
  }
);

onIpcMainEvent(
  '__internal_rpc:popupview-on-mainwin:toggle-show',
  (_, payload) => {
    handler(payload);
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
