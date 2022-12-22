import { BrowserWindow } from 'electron';
import { firstValueFrom } from 'rxjs';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { fromMainSubject, valueToMainSubject } from './_init';
import {
  createPopupWindow,
  hidePopupWindow,
  showPopupWindow,
} from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  window: BrowserWindow,
  triggerPoint?: Electron.Point & { width?: number; height?: number }
) {
  if (window.isDestroyed()) return;

  const popupRect = {
    // TODO: use dynamic position
    x: 5,
    y: 5,
    width: 100,
    height: 100,
    ...triggerPoint,
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

const sidebarReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
  });

  updateSubWindowPosition(mainWin.window, popupWin);
  const onTargetWinUpdate = () => {
    // updateSubWindowPosition(mainWin.window, popupWin);
    hidePopupWindow(popupWin);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(popupWin);
  });

  mainWin.window.on('focus', () => {
    hidePopupWindow(popupWin);
  });

  await popupWin.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/context-menu-popup__sidebar-dapp`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  return popupWin;
});

const switchChainReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const popupWin = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
  });

  updateSubWindowPosition(mainWin.window, popupWin);
  const onTargetWinUpdate = () => {
    // updateSubWindowPosition(mainWin.window, popupWin);
    hidePopupWindow(popupWin);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(popupWin);
  });

  mainWin.window.on('focus', () => {
    hidePopupWindow(popupWin);
  });

  await popupWin.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/context-menu-popup__switch-chain`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // popupWin.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(popupWin);

  return popupWin;
});

Promise.all([sidebarReady, switchChainReady]).then((wins) => {
  valueToMainSubject('contextMenuPopupWindowReady', {
    sidebar: wins[0],
    switchChain: wins[1],
  });
});

const SIZE_MAP: Record<
  IContextMenuPageInfo['type'],
  {
    width: number;
    height: number;
  }
> = {
  'sidebar-dapp': {
    width: 140,
    height: 100,
  },
  'switch-chain': {
    width: 272,
    height: 400,
  },
};

const { handler } = onIpcMainEvent(
  '__internal_rpc:context-menu-popup:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { sidebar, switchChain } = await firstValueFrom(
      fromMainSubject('contextMenuPopupWindowReady')
    );

    const targetWin =
      payload.type === 'sidebar-dapp'
        ? sidebar
        : payload.type === 'switch-chain'
        ? switchChain
        : null;

    if (!targetWin) return;

    if (payload.nextShow) {
      updateSubWindowPosition(mainWindow, targetWin, {
        x: payload.pos.x,
        y: payload.pos.y,
        ...SIZE_MAP[payload.type],
      });
      sendToWebContents(
        targetWin.webContents,
        '__internal_push:context-menu-popup:on-visiblechange',
        {
          type: payload.type,
          visible: true,
          pageInfo: payload.pageInfo,
        }
      );
      showPopupWindow(targetWin);
    } else {
      sendToWebContents(
        targetWin.webContents,
        '__internal_push:context-menu-popup:on-visiblechange',
        {
          type: payload.type,
          visible: false,
        }
      );
      hidePopupWindow(targetWin);
    }
  }
);

if (!IS_RUNTIME_PRODUCTION) {
  onIpcMainInternalEvent(
    '__internal_main:context-menu-popup:toggle-show',
    (payload) => {
      handler(null as any, payload);
    }
  );
}
