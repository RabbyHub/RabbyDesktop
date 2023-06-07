import { BrowserWindow } from 'electron';

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
  IControllPopupWindowOpts,
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
} from '../utils/browser';
import {
  getAllMainUIWindows,
  onMainWindowReady,
} from '../utils/stream-helpers';

const isDarwin = process.platform === 'darwin';

async function hidePopupOnMainWindow(
  mainWin: BrowserWindow | null,
  type: IPopupWinPageInfo['type'],
  opts?: IControllPopupWindowOpts
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

  if (type === 'top-ghost-window') {
    opts = { ...opts, forceUseOpacity: true };
  }

  hidePopupWindow(mainWin, opts);
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
      modal: false,
      show: true, // always show, control visibility by opacity
      opacity: 0,
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
      if (ghostFloatingWindow.isVisible() || isDarwin) {
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

    showPopupWindow(ghostFloatingWindow, { forceUseOpacity: false });
    // hidePopupWindow(ghostFloatingWindow);

    return ghostFloatingWindow;
  }
);

Promise.all([sidebarAppContextMenuReady, ghostFloatingWindowReady]).then(
  (wins) => {
    valueToMainSubject('popupWindowOnMain', {
      sidebarContext: wins[0],
      ghostFloatingWindow: wins[1],
    });
  }
);

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

    const isTopGhostWin = payload.type === 'top-ghost-window';

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
      showPopupWindow(targetWin, {
        isInActiveOnDarwin: isTopGhostWin,
        forceUseOpacity: isTopGhostWin,
      });
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

    // // don't toggle window's visibility in dev mode
    // if (!IS_RUNTIME_PRODUCTION) return;

    if (nextVisible) {
      showPopupWindow(ghostFloatingWindow, {
        forceUseOpacity: true,
        isInActiveOnDarwin: true,
      });
    } else {
      hidePopupWindow(ghostFloatingWindow, { forceUseOpacity: true });
    }
  }
);
