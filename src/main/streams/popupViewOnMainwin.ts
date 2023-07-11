import { BrowserView, BrowserWindow } from 'electron';

import { roundRectValue } from '@/isomorphic/shape';
import {
  InDappFindSizes,
  NativeAppSizes,
  RightSidePopupContentsSizes,
} from '@/isomorphic/const-size-next';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
  TOAST_TOP,
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
  getAllMainUIWindows,
  getOrSetDebugStates,
  getWebuiURLBase,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { notifyHideFindInPage } from '../utils/mainTabbedWin';

const viewsState: {
  [K in PopupViewOnMainwinInfo['type']]: {
    visible: boolean;
    readonly s_isModal?: boolean;
    modalWindow?: BrowserWindow;
  };
} = {
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
  'select-camera': {
    visible: false,
    // get s_isModal() {
    //   return true;
    // },
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
  'right-side-popup': {
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

function getRightSidePopupViewBounds(
  parentWindow: BrowserWindow,
  actualHeight: number
) {
  const pBounds = parentWindow.getBounds();

  return {
    width: NativeAppSizes.rightSidePopupWindowWidth,
    height: actualHeight,
    x: pBounds.width - NativeAppSizes.rightSidePopupWindowWidth,
    y: pBounds.height - actualHeight,
  };
}

function updateSubviewPos({
  parentWindow,
  view,
  viewTypeOrRect,
}: {
  parentWindow: BrowserWindow;
  view: BrowserView;
  viewTypeOrRect?: PopupViewOnMainwinInfo['type'] | Electron.Rectangle;
}) {
  const [width, height] = parentWindow.getSize();
  let popupRect = {
    x: 0,
    y: 0,
    width,
    height,
  };

  if (viewTypeOrRect === 'add-address-dropdown') {
    const selfBounds = view.getBounds();

    popupRect = {
      ...popupRect,
      ...selfBounds,
    };
  } else if (viewTypeOrRect === 'right-side-popup') {
    // keep self height by default, we will do `adjust-rect` later
    popupRect = getRightSidePopupViewBounds(
      parentWindow,
      Math.max(view.getBounds().height, 0)
    );
  } else if (typeof viewTypeOrRect === 'object') {
    popupRect = {
      ...popupRect,
      ...viewTypeOrRect,
    };
  }

  roundRectValue(popupRect);

  view.setBounds(popupRect);
  if (BrowserWindow.fromBrowserView(view) === parentWindow) {
    const isZpopupShownOnSelectCamera =
      viewTypeOrRect === 'z-popup' &&
      viewsState['z-popup'].visible &&
      viewsState['select-camera'].visible;
    if (!isZpopupShownOnSelectCamera) {
      parentWindow.setTopBrowserView(view);
    }
  } else if (!IS_RUNTIME_PRODUCTION) {
    console.error('updateSubviewPos: view is not attached to parentWindow!');
  }
}

const globalToastPopupState: Partial<
  PickPopupViewPageInfo<'global-toast-popup'>['state'] & object
> = { rectTopOffset: 0 };
function updateGlobalToastViewPos(
  parentWindow: BrowserWindow,
  view: BrowserView,
  opts?: {
    topOffset?: number;
  }
) {
  const [width, height] = parentWindow.getSize();
  let popupRect = {
    x: 0,
    y: 0,
    width,
    height,
  };

  popupRect.width = 600;
  const topOffset = opts?.topOffset || TOAST_TOP;
  globalToastPopupState.rectTopOffset = topOffset;
  popupRect = {
    ...popupRect,
    height: 80,
    // make it h-center
    x: Math.floor((width - popupRect.width) / 2),
    y: topOffset,
  };

  return updateSubviewPos({ parentWindow, view, viewTypeOrRect: popupRect });
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

  updateSubviewPos({ parentWindow: modalWindow, view: targetView });
  targetView.webContents.focus();

  showPopupWindow(modalWindow);
  modalWindow.focus();

  if (['select-devices'].includes(viewType)) {
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
      updateSubviewPos({
        parentWindow: mainWindow,
        view: addAddressPopup,
        viewTypeOrRect: 'add-address-dropdown',
      });
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
      updateSubviewPos({
        parentWindow: mainWindow,
        view: dappsManagementPopup,
        viewTypeOrRect: 'dapps-management',
      });
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

// const selectCamerasReady = onMainWindowReady().then(async () => {
//   const selectCameraPopup = createPopupView({});

//   await selectCameraPopup.webContents.loadURL(
//     `${await getWebuiURLBase()}/popup-view.html??view=select-camera#/`
//   );

//   // debug-only
//   if (!IS_RUNTIME_PRODUCTION) {
//     selectCameraPopup.webContents.openDevTools({ mode: 'detach' });
//   }

//   hidePopupView(selectCameraPopup);

//   return selectCameraPopup;
// });

const selectCamerasReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const selectCameraPopup = createPopupView({});

  mainWindow.addBrowserView(selectCameraPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['select-camera'].visible) {
      const oldBounds = selectCameraPopup.getBounds();
      updateSubviewPos({
        parentWindow: mainWindow,
        view: selectCameraPopup,
        viewTypeOrRect: oldBounds,
      });
    }
  };
  mainWindow.on('show', onTargetWinUpdate);
  mainWindow.on('move', onTargetWinUpdate);
  mainWindow.on('resized', onTargetWinUpdate);
  mainWindow.on('unmaximize', onTargetWinUpdate);
  mainWindow.on('restore', onTargetWinUpdate);

  await selectCameraPopup.webContents.loadURL(
    // `${RABBY_POPUP_GHOST_VIEW_URL}?view=select-camera`
    `${await getWebuiURLBase()}/popup-view.html?view=select-camera#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    selectCameraPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(selectCameraPopup);

  return selectCameraPopup;
});

const inDappFindReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const inDappFindPopup = createPopupView({});

  mainWindow.addBrowserView(inDappFindPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['in-dapp-find'].visible) {
      const oldBounds = inDappFindPopup.getBounds();
      updateSubviewPos({
        parentWindow: mainWindow,
        view: inDappFindPopup,
        viewTypeOrRect: oldBounds,
      });
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
    // inDappFindPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(inDappFindPopup);

  return inDappFindPopup;
});

const zPopupReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const zPopup = createPopupView({});

  mainWindow.addBrowserView(zPopup);

  const onTargetWinUpdate = () => {
    if (viewsState['z-popup'].visible)
      updateSubviewPos({
        parentWindow: mainWindow,
        view: zPopup,
        viewTypeOrRect: 'z-popup',
      });
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
    if (viewsState['global-toast-popup'].visible) {
      updateGlobalToastViewPos(mainWindow, globalToastPopup, {
        topOffset: globalToastPopupState.rectTopOffset,
      });
    }
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

const rightSidePopupViewReady = onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;

  const rightSidePopup = createPopupView({});

  mainWindow.addBrowserView(rightSidePopup);

  // const onTargetWinUpdate = () => {
  //   if (viewsState['right-side-popup'].visible) {
  //     updateSubviewPos({
  //       parentWindow: mainWindow,
  //       view: rightSidePopup,
  //       viewTypeOrRect: 'right-side-popup',
  //     });
  //   }
  // };
  // mainWindow.on('show', onTargetWinUpdate);
  // mainWindow.on('move', onTargetWinUpdate);
  // mainWindow.on('resized', onTargetWinUpdate);
  // mainWindow.on('unmaximize', onTargetWinUpdate);
  // mainWindow.on('restore', onTargetWinUpdate);

  await rightSidePopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=right-side-popup#/`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // rightSidePopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupView(rightSidePopup);

  return rightSidePopup;
});

Promise.all([
  addAddressReady,
  dappsManagementReady,
  selectDevicesReady,
  selectCamerasReady,
  inDappFindReady,
  zPopupReady,
  globalToastPopupReady,
  rightSidePopupViewReady,
]).then((views) => {
  valueToMainSubject('popupViewsOnMainwinReady', {
    addAddress: views[0],
    dappsManagement: views[1],
    selectDevices: views[2],
    selectCamera: views[3],
    inDappFind: views[4],
    zPopup: views[5],
    globalToastPopup: views[6],
    rightSidePopup: views[7],
  });
});

const { handler: handlerToggleShow } = onIpcMainInternalEvent(
  '__internal_main:popupview-on-mainwin:toggle-show',
  async (payload) => {
    const mainTabbedWin = await onMainWindowReady();
    const mainWindow = mainTabbedWin.window;
    const { views } = await getAllMainUIViews();
    const targetView = views[payload.type] || null;

    if (!targetView) return;

    if (payload.nextShow) {
      if (payload.type !== 'in-dapp-find') {
        notifyHideFindInPage();
      }

      viewsState[payload.type].visible = true;
      if (!viewsState[payload.type].s_isModal) {
        switch (payload.type) {
          case 'add-address-dropdown': {
            updateSubviewPos({
              parentWindow: mainWindow,
              view: targetView,
              viewTypeOrRect: (payload.pageInfo as any).triggerRect,
            });
            break;
          }
          case 'in-dapp-find': {
            const tabOrigin = (payload.pageInfo as any).searchInfo.tabOrigin;

            updateSubviewPos({
              parentWindow: mainWindow,
              view: targetView,
              viewTypeOrRect: {
                ...InDappFindSizes,
                x: tabOrigin.x,
                y: tabOrigin.y,
              },
            });
            break;
          }
          case 'global-toast-popup': {
            const pageInfo = payload.pageInfo as PopupViewOnMainwinInfo & {
              type: typeof payload.type;
            };

            const topOffset = pageInfo.state?.rectTopOffset || 0;
            updateGlobalToastViewPos(mainWindow, targetView, { topOffset });
            break;
          }
          default: {
            updateSubviewPos({
              parentWindow: mainWindow,
              view: targetView,
              viewTypeOrRect: payload.type,
            });
            break;
          }
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
    handlerToggleShow(payload);
  }
);

const { handler: handlerAdjustRect } = onIpcMainInternalEvent(
  '__internal_main:popupview-on-mainwin:adjust-rect',
  async (payload) => {
    switch (payload.type) {
      case 'right-side-popup': {
        const txNotifyCount = payload.contents.txNotificationCount;
        const { views } = await getAllMainUIViews();
        const mainTabbedWin = await onMainWindowReady();

        const actualHeight = !txNotifyCount
          ? 0
          : txNotifyCount *
              RightSidePopupContentsSizes.rightSideTxNotificationItemHeight +
            RightSidePopupContentsSizes.rightSideTxNotificationItemVPaddingOffset *
              2;

        const popupRect = getRightSidePopupViewBounds(
          mainTabbedWin.window,
          actualHeight
        );
        updateSubviewPos({
          parentWindow: mainTabbedWin.window,
          view: views[payload.type],
          viewTypeOrRect: popupRect,
        });

        break;
      }
      default: {
        console.error(`[popupview-on-mainwin] unknown type: ${payload.type}`);
        break;
      }
    }
  }
);

onIpcMainEvent(
  '__internal_rpc:popupview-on-mainwin:adjust-rect',
  (_, payload) => {
    handlerAdjustRect(payload);
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

const { handler: handlerChannelMessage } = onIpcMainInternalEvent(
  '__internal_main:views:channel-message',
  async (payload) => {
    let views: BrowserView['webContents'][] = [];
    const { hash, list } = await getAllMainUIViews();
    const { windows } = await getAllMainUIWindows();

    switch (payload.targetView) {
      case '*':
        views = list;
        break;
      case 'main-window':
        views = hash.mainWindow ? [hash.mainWindow] : [];
        break;
      case 'dapps-management':
        views = [hash.dappsManagement];
        break;
      case 'z-popup':
        views = [hash.zPopup];
        break;
      case 'top-ghost-window': {
        views = [
          windows['top-ghost-window'].webContents,
          windows['main-window'].webContents,
        ];

        if (payload.type === 'debug:toggle-highlight') {
          const { nextStates } = await getOrSetDebugStates((prevStates) => ({
            isGhostWindowDebugHighlighted:
              payload.payload.isHighlight ??
              !prevStates.isGhostWindowDebugHighlighted,
          }));

          payload.payload.isHighlight =
            nextStates.isGhostWindowDebugHighlighted;
        }
        break;
      }
      default: {
        if (!IS_RUNTIME_PRODUCTION) {
          throw new Error(
            `[popupViewOnMainwin] Unknown targetView: ${
              (payload as any).targetView
            }`
          );
        }
        return;
      }
    }

    views.forEach((webContents) => {
      webContents.send('__internal_forward:views:channel-message', payload);
    });
  }
);

onIpcMainEvent('__internal_forward:views:channel-message', (_, payload) => {
  handlerChannelMessage(payload);
});
