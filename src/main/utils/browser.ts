import { BrowserView, BrowserWindow } from 'electron';

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
    hasShadow: false,
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

/**
 * @description on windows, we assume the popupWin has been shown by calling `window.show()` or set `show: true` on constucting,
 * you sure make sure the window is visiblebefore calling this.
 *
 * The same requirement applies to hidePopupWindow
 */
export function showPopupWindow(popupWin: BrowserWindow) {
  if (process.platform === 'win32') {
    popupWin.setOpacity(1);
  } else {
    popupWin.show();
  }
}

export function hidePopupWindow(popupWin: BrowserWindow) {
  if (process.platform === 'win32') {
    popupWin.setOpacity(0);
  } else {
    popupWin.hide();
  }
}
