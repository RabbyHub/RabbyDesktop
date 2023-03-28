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
  createPopupWindow,
  hidePopupWindow,
  isPopupWindowHidden,
  showPopupWindow,
} from '../utils/browser';
import {
  getAllMainUIWindows,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { MainWindowTab } from '../browser/tabs';

async function hidePopupOnMainWindow(
  targetWin: BrowserWindow | null,
  type: IPopupWinPageInfo['type']
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
    transparent: true,
    hasShadow: false,
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

const inDappFindReady = onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const inDappFind = createPopupWindow({
    parent: mainWin.window,
    transparent: false,
    hasShadow: true,
    closable: false,
    movable: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: false,
  });

  // disable close by shortcut
  inDappFind.on('close', (evt) => {
    evt.preventDefault();

    return false;
  });

  updateSubWindowRect(mainWin.window, inDappFind);
  const onTargetWinUpdate = () => {
    if (!isPopupWindowHidden(inDappFind)) {
      (mainWin.tabs.selected as MainWindowTab)?.rePosFindWindow();
    }
    // hidePopupOnMainWindow(inDappFind, 'in-dapp-find');
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  mainWin.tabs.on('tab-focused', () => {
    // hidePopupOnMainWindow(inDappFind, 'in-dapp-find');
  });

  mainWin.window.on('focus', () => {
    // hidePopupOnMainWindow(inDappFind, 'in-dapp-find');
  });

  await inDappFind.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=in-dapp-find`
  );

  // debug-only
  if (!IS_RUNTIME_PRODUCTION) {
    inDappFind.webContents.openDevTools({ mode: 'detach' });
  }

  hidePopupWindow(inDappFind);

  return inDappFind;
});

Promise.all([sidebarReady, inDappFindReady]).then((wins) => {
  valueToMainSubject('popupWindowOnMain', {
    sidebarContext: wins[0],
    inDappFind: wins[1],
  });
});

const SIZE_MAP: Record<
  IPopupWinPageInfo['type'],
  {
    width: number;
    height: number;
  }
> = {
  'sidebar-dapp': {
    width: 140,
    height: 148,
  },
  'in-dapp-find': {
    // close to 6.8192
    width: 356,
    height: 52,
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

const { handler: handlerToggleShowPopupWins } = onIpcMainInternalEvent(
  '__internal_main:popupwin-on-mainwin:toggle-show',
  async (payload) => {
    const mainWindow = (await onMainWindowReady()).window;
    const { popupOnly } = await getAllMainUIWindows();

    const targetWin = popupOnly[payload.type] || null;

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

onIpcMainEvent(
  '__internal_rpc:popupwin-on-mainwin:toggle-show',
  async (_, payload) => {
    handlerToggleShowPopupWins(payload);
  }
);
