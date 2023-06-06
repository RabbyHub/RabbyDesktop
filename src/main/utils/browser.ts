import { NativeAppSizes } from '@/isomorphic/const-size-next';
import {
  SAFE_WEBPREFERENCES,
  RABBY_BLANKPAGE_RELATIVE_URL,
} from '@/isomorphic/constants';
import { getRabbyXWindowPosition } from '@/isomorphic/rabbyx';
import { roundRectValue } from '@/isomorphic/shape';
import { BrowserView, BrowserWindow } from 'electron';
import { isEnableContentProtected } from '../store/desktopApp';
import { getAssetPath } from './app';
import { emitIpcMainEvent } from './ipcMainEvents';
import { getMainWindowTopOffset } from './browserSize';

const isDarwin = process.platform === 'darwin';

export function getWindowFromWebContents(webContents: Electron.WebContents) {
  switch (webContents.getType()) {
    case 'remote':
    case 'window':
    case 'browserView':
    case 'webview':
      return BrowserWindow.fromWebContents(webContents);
    case 'backgroundPage':
      return (
        BrowserWindow.fromWebContents(webContents) ||
        BrowserWindow.getFocusedWindow()
      );
    default:
      throw new Error(
        `Unable to find parent window of '${webContents.getType()}'`
      );
  }
}

export function redirectToAboutBlank(webContents: Electron.WebContents) {
  webContents.loadURL('about:blank');
}

export function redirectToBlankPage(webContents: Electron.WebContents) {
  webContents.loadURL(getAssetPath(RABBY_BLANKPAGE_RELATIVE_URL));
}

export function destroyBrowserWebview(view?: BrowserView | null) {
  if (!view) return;

  // undocumented behaviors
  (view.webContents as any)?.destroyed?.();
  (view as any)?.destroyed?.();
}

const IS_DARWIN = process.platform === 'darwin';

function getPopupWinDefaultOpts<
  T extends Electron.BrowserWindowConstructorOptions
>(opts?: T) {
  return {
    titleBarStyle: 'hiddenInset',
    ...(IS_DARWIN
      ? {
          opacity: 1,
          closable: true,
          trafficLightPosition: { x: -9999, y: -9999 },
          transparent: true,
          backgroundColor: '#00ffffff',
        }
      : {
          opacity: 0,
          show: true,
          transparent: true,
        }),
    ...(opts?.transparent !== undefined && {
      transparent: !!opts?.transparent,
    }),
    webPreferences: {
      ...opts?.webPreferences,
      // session: await getTemporarySession(),
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      contextIsolation: true,
    },
  } as const;
}

export function createPopupModalWindow(
  opts: Omit<
    Electron.BrowserWindowConstructorOptions,
    | 'hasShadow'
    | 'modal'
    // | 'frame'
    | 'closable'
    | 'movable'
    | 'resizable'
    | 'minimizable'
    | 'maximizable'
    | 'fullscreenable'
    | 'alwaysOnTop'
    | 'show'
    | 'opacity'
    | 'skipTaskbar'
    | 'titleBarStyle'
    | 'trafficLightPosition'
    | 'backgroundColor'
  > & {
    parent: Exclude<Electron.BrowserWindowConstructorOptions['parent'], void>;
  }
) {
  const window = new BrowserWindow({
    ...opts,
    hasShadow: false,
    modal: true,
    movable: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    ...getPopupWinDefaultOpts(opts),
    frame: !!opts.frame,
    webPreferences: {
      ...SAFE_WEBPREFERENCES,
      webviewTag: false,
    },
  });

  if (isEnableContentProtected()) {
    window.setContentProtection(true);
  }

  return window;
}

export function createPopupWindow(
  opts?: Electron.BrowserWindowConstructorOptions
) {
  const window = new BrowserWindow({
    hasShadow: false,
    ...opts,
    show: false,
    frame: false,
    modal: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    ...getPopupWinDefaultOpts(opts),
  });

  if (isEnableContentProtected()) {
    window.setContentProtection(true);
  }

  return window;
}

export function createTmpEmptyBrowser() {
  const window = new BrowserWindow({
    hasShadow: false,
    ...getPopupWinDefaultOpts(),
    show: false,
    frame: false,
    modal: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    width: 1,
    height: 1,
  });

  return {
    tmpWindow: window,
    asyncClose: () => {
      setTimeout(() => {
        window.hide();
        window.destroy();
      }, 300);
    },
  };
}

export type IControllPopupWindowOpts = { forceUseOpacity?: boolean };

/**
 * @description on windows, we assume the popupWin has been shown by calling `window.show()` or set `show: true` on constucting,
 * you need to make sure the window is visible before calling this.
 *
 * The same requirement applies to hidePopupWindow
 */
export function showPopupWindow(
  popupWin: BrowserWindow,
  opts?: {
    isInActiveOnDarwin?: boolean;
  } & IControllPopupWindowOpts
) {
  if (!IS_DARWIN || opts?.forceUseOpacity) {
    if (!popupWin.isVisible()) {
      popupWin.show();
    }
    popupWin.setOpacity(1);
  } else if (opts?.isInActiveOnDarwin) {
    popupWin.showInactive();
  } else {
    popupWin.show();
  }
}

export function hidePopupWindow(
  popupWin: BrowserWindow,
  opts?: IControllPopupWindowOpts
) {
  if (!IS_DARWIN || opts?.forceUseOpacity) {
    popupWin.setOpacity(0);
  } else {
    popupWin.hide();
  }
}

export function isPopupWindowHidden(popupWin: BrowserWindow) {
  return !popupWin.isVisible() || popupWin.getOpacity() <= 0.1;
}

export function createPopupView(opts?: Electron.BrowserViewConstructorOptions) {
  return new BrowserView({
    ...opts,
    webPreferences: {
      ...opts?.webPreferences,
      webviewTag: true,
      sandbox: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      contextIsolation: true,
    },
  });
}

export function hidePopupView(view: BrowserView) {
  const bounds = view.getBounds();
  view.setBounds({
    ...bounds,
    width: 1,
    height: 1,
    x: -99999,
    y: -99999,
  });
}

export function switchToBrowserTab(
  tabId: chrome.tabs.Tab['id'],
  tabbedWin: import('../browser/browsers').default
) {
  tabbedWin?.tabs.select(tabId);
  // webuiExtension's webContents is just the webContents of tabbedWin its belongs to
  tabbedWin?.sendMessageToShellUI(
    '__internal_push:webui-extension:switch-active-dapp',
    {
      tabId,
    }
  );
}

export function browserWindowOn<T extends EventTypeOfBrowserOn>(
  win: BrowserWindow,
  event: T,
  listener: GetListenerByEvent<BrowserWindow['on'], T>
) {
  win.on(event as any, listener);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;

    disposed = true;
    win.off(event, listener);
  };

  return dispose;
}

const isWin32 = process.platform === 'win32';
const rWinWidth = NativeAppSizes.rabbyxNotificationWindowWidth;

export function parseRabbyxNotificationParams(
  mainWindow: BrowserWindow,
  opts: {
    details: Pick<chrome.windows.CreateData, 'height' | 'width'>;
    signApprovalType: string | null;
  }
) {
  const mainBounds = mainWindow.getBounds();
  const topOffset = getMainWindowTopOffset();

  const { signApprovalType, details } = opts || {};

  const result = {
    finalBounds: { width: 0, height: 0, x: 0, y: 0 } as Electron.Rectangle,
    shouldPosCenter: false,
  };

  const selfBounds = {
    width: details?.width || 400,
    height: details?.height || 400,
  };

  const rWinPos = getRabbyXWindowPosition(signApprovalType);
  if (rWinPos === 'right-pinned') {
    result.finalBounds = {
      ...selfBounds,
      x: mainBounds.x + (mainBounds.width - selfBounds.width - 10),
      y:
        mainBounds.y +
        NativeAppSizes.mainWindowDappTopOffset +
        getMainWindowTopOffset(),
    };
    // result.shouldPosCenter = true;
  } else if (rWinPos !== 'center') {
    // dock right
    const maxHeight = mainBounds.height - topOffset;
    const maxWith = isWin32 ? rWinWidth - 1 : rWinWidth;

    result.finalBounds = {
      width: maxWith,
      height: maxHeight - 1,
      x: mainBounds.x + mainBounds.width - rWinWidth,
      y: mainBounds.y + topOffset,
    };
  } else {
    result.finalBounds = {
      ...selfBounds,
      x: mainBounds.x + (mainBounds.width - selfBounds.width) / 2,
      y: mainBounds.y + (mainBounds.height - selfBounds.height) / 2,
    };

    result.shouldPosCenter = true;
  }

  roundRectValue(result.finalBounds);

  return result;
}

export async function captureWebContents(webContents: Electron.WebContents) {
  if (webContents.isDestroyed()) {
    return null;
  }

  return webContents.capturePage();
}

const dappLoadingViewState = {
  loadingTabId: -1 as number,
};
export function isDappViewLoadingForTab(tabId: number) {
  return (
    dappLoadingViewState.loadingTabId > 0 &&
    dappLoadingViewState.loadingTabId === tabId
  );
}
export function isDappViewLoading() {
  return dappLoadingViewState.loadingTabId > 0;
}
export function putDappLoadingViewState(
  partials: Partial<typeof dappLoadingViewState>
) {
  Object.assign(dappLoadingViewState, partials);
}
export function hideLoadingView() {
  emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
    type: 'hide',
  });
}

export function getTitlebarOffsetForMacOS() {
  return isDarwin ? 28 : 0;
}

let modalWindowTitlebarOffset: number | null = null;
/**
 * @see https://github.com/electron/electron/issues/6287
 * @deprecated
 */
export async function getOrRecordTitlebarOffset(record?: {
  expectedH: number;
}) {
  if (process.platform !== 'darwin') return 0;

  if (record) {
    if (modalWindowTitlebarOffset !== null) {
      throw new Error('modalWindowTitlebarOffset has been set');
    }
    const testSize = { width: 500, height: 400 };
    const parentWindow = new BrowserWindow({
      width: 1000,
      height: 1000,
    });

    const modalWindow = new BrowserWindow({
      modal: true,
      parent: parentWindow,
      width: testSize.width,
      height: testSize.height,
      show: false,
      movable: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      frame: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: false,
        sandbox: true,
      },
    });

    const actualHeight = await modalWindow.webContents.executeJavaScript(
      `window.innerHeight`
    );

    modalWindowTitlebarOffset = actualHeight - record.expectedH;
  }

  return modalWindowTitlebarOffset || 0;
}
