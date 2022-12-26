import { BrowserView, BrowserWindow } from 'electron';

export function getWindowFromWebContents(tab: Electron.WebContents) {
  switch (tab.getType()) {
    case 'window':
      return BrowserWindow.fromWebContents(tab);
    case 'browserView':
    case 'webview':
      // return tab.getOwnerBrowserWindow();
      return BrowserWindow.fromWebContents(tab);
    case 'backgroundPage':
      return (
        BrowserWindow.fromWebContents(tab) || BrowserWindow.getFocusedWindow()
      );
    default:
      throw new Error(`Unable to find parent window of '${tab.getType()}'`);
  }
}

export function destroyBrowserWebview(view?: BrowserView | null) {
  if (!view) return;

  // undocumented behaviors
  (view.webContents as any)?.destroyed?.();
  (view as any)?.destroyed?.();
}

const IS_DARWIN = process.platform === 'darwin';

export function createPopupWindow(
  opts?: Electron.BrowserWindowConstructorOptions
) {
  return new BrowserWindow({
    hasShadow: false,
    ...opts,
    show: false,
    frame: false,
    parent: opts?.parent,
    modal: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
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
  });
}

const isDarwin = process.platform === 'darwin';
/**
 * @description on windows, we assume the popupWin has been shown by calling `window.show()` or set `show: true` on constucting,
 * you sure make sure the window is visiblebefore calling this.
 *
 * The same requirement applies to hidePopupWindow
 */
export function showPopupWindow(
  popupWin: BrowserWindow,
  opts?: {
    isInActiveOnDarwin: boolean;
  }
) {
  if (isDarwin) {
    if (opts?.isInActiveOnDarwin) {
      popupWin.showInactive();
    } else {
      popupWin.show();
    }
  } else {
    popupWin.setOpacity(1);
  }
}

export function hidePopupWindow(popupWin: BrowserWindow) {
  if (isDarwin) {
    popupWin.hide();
  } else {
    popupWin.setOpacity(0);
  }
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
