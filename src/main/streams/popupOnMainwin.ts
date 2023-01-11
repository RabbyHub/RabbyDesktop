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

async function hidePopupOnMainWindow(
  targetWin: BrowserWindow | null,
  type: IContextMenuPageInfo['type']
) {
  if (!targetWin || targetWin.isDestroyed()) return;

  sendToWebContents(
    targetWin.webContents,
    '__internal_push:popupwin-on-mainwin:on-visiblechange',
    {
      type,
      visible: false,
    }
  );

  hidePopupWindow(targetWin);
}

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
    if (sidebarAppPopup.isVisible())
      hidePopupOnMainWindow(sidebarAppPopup, 'sidebar-dapp');
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupOnMainWindow(sidebarAppPopup, 'sidebar-dapp');
  });

  mainWin.window.on('focus', () => {
    hidePopupOnMainWindow(sidebarAppPopup, 'sidebar-dapp');
  });

  await sidebarAppPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__sidebar-dapp`
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
    if (switchChainPopup.isVisible())
      hidePopupOnMainWindow(switchChainPopup, 'switch-chain');
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupOnMainWindow(switchChainPopup, 'switch-chain');
  });

  mainWin.window.on('focus', () => {
    hidePopupOnMainWindow(switchChainPopup, 'switch-chain');
  });

  await switchChainPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__switch-chain`
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
    if (switchAccountPopup.isVisible())
      hidePopupOnMainWindow(switchAccountPopup, 'switch-account');
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupOnMainWindow(switchAccountPopup, 'switch-account');
  });

  mainWin.window.on('focus', () => {
    hidePopupOnMainWindow(switchAccountPopup, 'switch-account');
  });

  await switchAccountPopup.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__switch-account`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // switchAccountPopup.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupOnMainWindow(switchAccountPopup, 'switch-account');

  return switchAccountPopup;
});

const quickSwapReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const quickSwap = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: false,
    closable: false,
    movable: false,
    alwaysOnTop: true,
  });

  // disable close by shortcut
  quickSwap.on('close', (evt) => {
    evt.preventDefault();

    return false;
  });

  updateSubWindowRect(mainWin.window, quickSwap);
  const onTargetWinUpdate = () => {
    if (quickSwap.isVisible()) hidePopupOnMainWindow(quickSwap, 'quick-swap');
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    hidePopupOnMainWindow(quickSwap, 'quick-swap');
  });

  mainWin.window.on('focus', () => {
    hidePopupOnMainWindow(quickSwap, 'quick-swap');
  });

  await quickSwap.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}#/popup__quick-swap`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    // quickSwap.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupOnMainWindow(quickSwap, 'quick-swap');

  return quickSwap;
});

Promise.all([
  sidebarReady,
  switchChainReady,
  switchAccountReady,
  quickSwapReady,
]).then((wins) => {
  valueToMainSubject('contextMenuPopupWindowReady', {
    sidebarContext: wins[0],
    switchChain: wins[1],
    switchAccount: wins[2],

    quickSwap: wins[3],
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
  'switch-account': {
    width: 240,
    height: 60 * 2 + 1,
  },
  'quick-swap': {
    width: 337,
    height: 626,
  },
};

function pickWH(
  type: IContextMenuPageInfo['type'],
  input: { width?: number; height?: number }
) {
  let result: Required<typeof input>;
  switch (type) {
    case 'switch-account':
      result = {
        width: SIZE_MAP[type].width,
        height: input.height || SIZE_MAP[type].height,
      };
      break;
    default:
      result = { ...SIZE_MAP[type] };
      break;
  }

  result.width = Math.round(result.width);
  result.height = Math.round(result.height);

  return result;
}

const { handler } = onIpcMainEvent(
  '__internal_rpc:popupwin-on-mainwin:toggle-show',
  async (_, payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { sidebarContext, switchChain, switchAccount, quickSwap } =
      await firstValueFrom(fromMainSubject('contextMenuPopupWindowReady'));

    const targetWin =
      payload.type === 'sidebar-dapp'
        ? sidebarContext
        : payload.type === 'switch-chain'
        ? switchChain
        : payload.type === 'switch-account'
        ? switchAccount
        : payload.type === 'quick-swap'
        ? quickSwap
        : null;

    if (!targetWin) return;

    if (payload.nextShow) {
      updateSubWindowRect(mainWindow, targetWin, {
        x: payload.rect.x,
        y: payload.rect.y,
        ...pickWH(payload.type, payload.rect),
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

if (!IS_RUNTIME_PRODUCTION) {
  onIpcMainInternalEvent(
    '__internal_main:popupwin-on-mainwin:toggle-show',
    (payload) => {
      handler(null as any, payload);
    }
  );
}
