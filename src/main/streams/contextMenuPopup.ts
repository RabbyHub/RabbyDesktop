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

function updateSubWindowRect(
  parentWin: BrowserWindow,
  window: BrowserWindow,
  windowRect?: Electron.Point & { width?: number; height?: number }
) {
  if (window.isDestroyed()) return;

  const popupRect = {
    // TODO: use dynamic position
    x: 5,
    y: 5,
    width: 100,
    height: 100,
    ...windowRect,
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

  const sidebarAppPopup = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
  });

  // disable close by shortcut
  sidebarAppPopup.on('close', (evt) => {
    evt.preventDefault();

    return false;
  });

  updateSubWindowRect(mainWin.window, sidebarAppPopup);
  const onTargetWinUpdate = () => {
    hidePopupWindow(sidebarAppPopup);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(sidebarAppPopup);
  });

  mainWin.window.on('focus', () => {
    hidePopupWindow(sidebarAppPopup);
  });

  await sidebarAppPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/context-menu-popup__sidebar-dapp`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // sidebarAppPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(sidebarAppPopup);

  return sidebarAppPopup;
});

const switchChainReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const switchChainPopup = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
  });

  // disable close by shortcut
  switchChainPopup.on('close', (evt) => {
    evt.preventDefault();

    return false;
  });

  updateSubWindowRect(mainWin.window, switchChainPopup);
  const onTargetWinUpdate = () => {
    hidePopupWindow(switchChainPopup);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(switchChainPopup);
  });

  mainWin.window.on('focus', () => {
    hidePopupWindow(switchChainPopup);
  });

  await switchChainPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/context-menu-popup__switch-chain`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // switchChainPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(switchChainPopup);

  return switchChainPopup;
});

const switchAccountReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const switchAccountPopup = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
  });

  // disable close by shortcut
  switchAccountPopup.on('close', (evt) => {
    evt.preventDefault();

    return false;
  });

  updateSubWindowRect(mainWin.window, switchAccountPopup);
  const onTargetWinUpdate = () => {
    hidePopupWindow(switchAccountPopup);
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupWindow(switchAccountPopup);
  });

  mainWin.window.on('focus', () => {
    hidePopupWindow(switchAccountPopup);
  });

  await switchAccountPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__switch-account`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // switchAccountPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(switchAccountPopup);

  return switchAccountPopup;
});

Promise.all([sidebarReady, switchChainReady, switchAccountReady]).then(
  (wins) => {
    valueToMainSubject('contextMenuPopupWindowReady', {
      sidebarContext: wins[0],
      switchChain: wins[1],
      switchAccount: wins[2],
    });
  }
);

const SIZE_MAP: Record<
  IContextMenuPageInfo['type'],
  {
    width?: number;
    height?: number;
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
  'switch-account': {
    width: 200,
    height: 60 * 2 + 1,
  },
};

const { handler } = onIpcMainEvent(
  '__internal_rpc:context-menu-popup:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { sidebarContext, switchChain, switchAccount } = await firstValueFrom(
      fromMainSubject('contextMenuPopupWindowReady')
    );

    const targetWin =
      payload.type === 'sidebar-dapp'
        ? sidebarContext
        : payload.type === 'switch-chain'
        ? switchChain
        : payload.type === 'switch-account'
        ? switchAccount
        : null;

    if (!targetWin) return;

    if (payload.nextShow) {
      updateSubWindowRect(mainWindow, targetWin, {
        x: payload.rect.x,
        y: payload.rect.y,
        width: payload.rect.width || SIZE_MAP[payload.type].width,
        height: payload.rect.height || SIZE_MAP[payload.type].height,
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
