import { BrowserWindow } from 'electron';

import {
  NativeAppSizes,
  RightSidePopupContentsSizes,
} from '@/isomorphic/const-size-next';
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
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
} from '../utils/browser';
import {
  getAllMainUIWindows,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { getMainWindowTopOffset } from '../utils/browserSize';

const isDarwin = process.platform === 'darwin';

async function hidePopupOnMainWindow(
  mainWin: BrowserWindow | null,
  type: IPopupWinPageInfo['type']
) {
  if (!mainWin || mainWin.isDestroyed()) return;

  sendToWebContents(
    mainWin.webContents,
    '__internal_push:popupwin-on-mainwin:on-visiblechange',
    {
      type,
      visible: false,
    }
  );

  hidePopupWindow(mainWin);
}

const SIZE_MAP: Record<
  IPopupWinPageInfo['type'],
  {
    width: number;
    height: number;
  }
> = {
  'sidebar-dapp-contextmenu': {
    width: 210,
    height: 350,
  },
  'top-ghost-window': {
    width: 1366,
    height: 768,
  },
  'right-side-popup': {
    width: NativeAppSizes.rightSidePopupWindowWidth,
    height: 0,
  },
};

function pickWH(
  type: IPopupWinPageInfo['type'],
  input: { width?: number; height?: number }
) {
  let result: Required<typeof input>;
  switch (type) {
    default:
      result = { ...SIZE_MAP[type] };
      break;
  }

  result.width = Math.round(result.width);
  result.height = Math.round(result.height);

  return result;
}

const rightSidePopupState = {
  notifyCount: 0,
};
function getRightSidePopupViewBounds(parentWindow: BrowserWindow) {
  const pBounds = parentWindow.getBounds();

  const fullHeight = pBounds.height - getMainWindowTopOffset();

  let actualHeight = !rightSidePopupState.notifyCount
    ? 0
    : rightSidePopupState.notifyCount *
        RightSidePopupContentsSizes.rightSideTxNotificationItemHeight +
      RightSidePopupContentsSizes.rightSideTxNotificationItemVPaddingOffset * 2;

  actualHeight = Math.max(actualHeight, Math.round(fullHeight / 2));

  return {
    width: NativeAppSizes.rightSidePopupWindowWidth,
    height: actualHeight,
    x: pBounds.width - NativeAppSizes.rightSidePopupWindowWidth,
    y: pBounds.height - actualHeight,
  };
}

function updateSubWindowRect({
  parentWin,
  window,
  windowType,
  nextRect,
}: {
  parentWin: BrowserWindow;
  window: BrowserWindow;
  windowType: IPopupWinPageInfo['type'];
  nextRect?: Electron.Point & Partial<Electron.Rectangle>;
}) {
  if (window.isDestroyed()) return;

  const pBounds = parentWin.getBounds();

  const popupRect = {
    x: 0,
    y: 0,
    ...nextRect,
    ...pickWH(windowType, { width: nextRect?.width, height: nextRect?.height }),
    ...(windowType === 'top-ghost-window' && {
      ...pBounds,
      x: 0,
      y: 0,
    }),
    ...(windowType === 'right-side-popup' && {
      ...window.getBounds(),
      ...getRightSidePopupViewBounds(parentWin),
    }),
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

const sidebarAppContextMenuReady = onMainWindowReady().then(
  async (mainTabbedWin) => {
    const mainWin = mainTabbedWin.window;

    const sidebarAppContextMenuPopup = createPopupWindow({
      parent: mainTabbedWin.window,
      transparent: true,
      hasShadow: false,
      closable: false,
    });

    // disable close by shortcut
    sidebarAppContextMenuPopup.on('close', (evt) => {
      evt.preventDefault();

      return false;
    });

    updateSubWindowRect({
      parentWin: mainTabbedWin.window,
      window: sidebarAppContextMenuPopup,
      windowType: 'sidebar-dapp-contextmenu',
    });
    const onTargetWinUpdate = () => {
      if (sidebarAppContextMenuPopup.isVisible())
        hidePopupOnMainWindow(
          sidebarAppContextMenuPopup,
          'sidebar-dapp-contextmenu'
        );
    };
    mainWin.on('show', onTargetWinUpdate);
    mainWin.on('move', onTargetWinUpdate);
    mainWin.on('resized', onTargetWinUpdate);
    mainWin.on('unmaximize', onTargetWinUpdate);
    mainWin.on('restore', onTargetWinUpdate);

    mainTabbedWin.tabs.on('tab-focused', () => {
      hidePopupOnMainWindow(
        sidebarAppContextMenuPopup,
        'sidebar-dapp-contextmenu'
      );
    });

    mainTabbedWin.window.on('focus', () => {
      hidePopupOnMainWindow(
        sidebarAppContextMenuPopup,
        'sidebar-dapp-contextmenu'
      );
    });

    await sidebarAppContextMenuPopup.webContents.loadURL(
      `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__sidebar-dapp`
    );

    // debug-only
    if (!IS_RUNTIME_PRODUCTION) {
      // sidebarAppContextMenuPopup.webContents.openDevTools({ mode: 'detach' });
    }

    hidePopupWindow(sidebarAppContextMenuPopup);

    return sidebarAppContextMenuPopup;
  }
);

const ghostFloatingWindowReady = onMainWindowReady().then(
  async (mainTabbedWin) => {
    const mainWin = mainTabbedWin.window;

    const ghostFloatingWindow = createPopupWindow({
      parent: mainTabbedWin.window,
      transparent: true,
      hasShadow: false,
      closable: false,
      focusable: false,
      alwaysOnTop: false, // set it to false to make it not on top of other APP's windows
    });

    // disable close by shortcut
    ghostFloatingWindow.on('close', (evt) => {
      evt.preventDefault();

      return false;
    });

    ghostFloatingWindow.on('focus', () => {
      if (IS_RUNTIME_PRODUCTION) {
        ghostFloatingWindow.blur();
        ghostFloatingWindow.blurWebView();
      }
    });

    // don't accept mouse events
    ghostFloatingWindow.setIgnoreMouseEvents(true, { forward: isDarwin });

    updateSubWindowRect({
      parentWin: mainTabbedWin.window,
      window: ghostFloatingWindow,
      windowType: 'top-ghost-window',
    });
    const onTargetWinUpdate = () => {
      if (ghostFloatingWindow.isVisible()) {
        updateSubWindowRect({
          parentWin: mainTabbedWin.window,
          window: ghostFloatingWindow,
          windowType: 'top-ghost-window',
        });
      }
    };
    mainWin.on('show', onTargetWinUpdate);
    mainWin.on('move', onTargetWinUpdate);
    mainWin.on('resized', onTargetWinUpdate);
    mainWin.on('unmaximize', onTargetWinUpdate);
    mainWin.on('restore', onTargetWinUpdate);

    await ghostFloatingWindow.webContents.loadURL(
      `${RABBY_POPUP_GHOST_VIEW_URL}?view=top-ghost-window`
    );

    // debug-only
    if (!IS_RUNTIME_PRODUCTION) {
      // ghostFloatingWindow.webContents.openDevTools({ mode: 'detach' });
    }

    showPopupWindow(ghostFloatingWindow);
    // hidePopupWindow(ghostFloatingWindow);

    return ghostFloatingWindow;
  }
);

const rightSidePopupWindowReady = onMainWindowReady().then(
  async (mainTabbedWin) => {
    const mainWin = mainTabbedWin.window;

    const rightSidePopupWindow = createPopupWindow({
      parent: mainTabbedWin.window,
      transparent: true,
      hasShadow: false,
      closable: false,
      focusable: true,
      alwaysOnTop: false,
    });

    // disable close by shortcut
    rightSidePopupWindow.on('close', (evt) => {
      evt.preventDefault();

      return false;
    });

    updateSubWindowRect({
      parentWin: mainTabbedWin.window,
      window: rightSidePopupWindow,
      windowType: 'right-side-popup',
    });
    const onTargetWinUpdate = () => {
      if (rightSidePopupWindow.isVisible()) {
        updateSubWindowRect({
          parentWin: mainTabbedWin.window,
          window: rightSidePopupWindow,
          windowType: 'right-side-popup',
        });
      }
    };
    mainWin.on('show', onTargetWinUpdate);
    mainWin.on('move', onTargetWinUpdate);
    mainWin.on('resized', onTargetWinUpdate);
    mainWin.on('unmaximize', onTargetWinUpdate);
    mainWin.on('restore', onTargetWinUpdate);

    await rightSidePopupWindow.webContents.loadURL(
      `${RABBY_POPUP_GHOST_VIEW_URL}?view=right-side-popup`
    );

    rightSidePopupWindow.setIgnoreMouseEvents(true);

    // debug-only
    if (!IS_RUNTIME_PRODUCTION) {
      // rightSidePopupWindow.webContents.openDevTools({ mode: 'detach' });
    }

    // hidePopupWindow(rightSidePopupWindow);
    showPopupWindow(rightSidePopupWindow);

    return rightSidePopupWindow;
  }
);

Promise.all([
  sidebarAppContextMenuReady,
  ghostFloatingWindowReady,
  rightSidePopupWindowReady,
]).then((wins) => {
  valueToMainSubject('popupWindowOnMain', {
    sidebarContext: wins[0],
    ghostFloatingWindow: wins[1],
    rightSidePopupWindow: wins[2],
  });
});

const { handler: handlerToggleShowPopupWins } = onIpcMainInternalEvent(
  '__internal_main:popupwin-on-mainwin:toggle-show',
  async (payload) => {
    const { popupOnly, windows } = await getAllMainUIWindows();
    const mainWin = windows['main-window'];

    const targetWin = popupOnly[payload.type] || null;

    if (!targetWin) {
      console.warn('popup window not found: ', payload.type);
      return;
    }

    if (payload.nextShow) {
      updateSubWindowRect({
        parentWin: mainWin,
        window: targetWin,
        windowType: payload.type,
        nextRect: {
          x: payload.rect.x,
          y: payload.rect.y,
        },
      });
      sendToWebContents(
        targetWin.webContents,
        '__internal_push:popupwin-on-mainwin:on-visiblechange',
        {
          type: payload.type,
          visible: true,
          pageInfo: payload.pageInfo,
        }
      );

      if (targetWin && !IS_RUNTIME_PRODUCTION && payload.openDevTools) {
        targetWin.webContents.openDevTools({ mode: 'detach' });
      }
      showPopupWindow(targetWin);
    } else {
      hidePopupOnMainWindow(targetWin, payload.type);
    }
  }
);

onIpcMainEvent(
  '__internal_rpc:popupwin-on-mainwin:toggle-show',
  async (_, payload) => {
    handlerToggleShowPopupWins(payload);
  }
);

onIpcMainEvent(
  '__internal_rpc:top-ghost-window:toggle-visible',
  async (_, nextVisible) => {
    const ghostFloatingWindow = await ghostFloatingWindowReady;

    // don't toggle window's visibility in dev mode
    if (!IS_RUNTIME_PRODUCTION) return;

    if (nextVisible) {
      showPopupWindow(ghostFloatingWindow);
    } else {
      hidePopupWindow(ghostFloatingWindow);
    }
  }
);

const { handler: handlerSetIgnoreMouseEvents } = onIpcMainInternalEvent(
  '__internal_main:popup-on-mainwin:adjust-rect',
  async (payload) => {
    switch (payload.type) {
      case 'right-side-popup': {
        const window = await rightSidePopupWindowReady;
        const txNotifyCount = payload.contents?.txNotificationCount || 0;

        rightSidePopupState.notifyCount = txNotifyCount;

        window.setIgnoreMouseEvents(!txNotifyCount);

        // const mainTabbedWin = await onMainWindowReady();
        // const popupRect = getRightSidePopupViewBounds(mainTabbedWin.window);
        // updateSubWindowRect({
        //   parentWin: mainTabbedWin.window,
        //   window,
        //   windowType: 'right-side-popup',
        //   nextRect: popupRect,
        // });

        break;
      }
      default: {
        console.error(`[popupview-on-mainwin] unknown type: ${payload.type}`);
        break;
      }
    }
  }
);

onIpcMainEvent('__internal_rpc:popup-on-mainwin:adjust-rect', (_, payload) => {
  handlerSetIgnoreMouseEvents(payload);
});
