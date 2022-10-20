import { BrowserView, BrowserWindow } from "electron";

export function destroyBrowserWebview(view?: BrowserView | null) {
  if (!view) return ;

  // undocumented behaviors
  (view.webContents as any)?.destroyed?.();
  (view as any)?.destroyed?.();
}

export function createPopupWindow (
  opts?: Electron.BrowserWindowConstructorOptions,
) {
  return new BrowserWindow({
    ...opts,
    show: false,
    frame: false,
    parent: opts?.parent,
    movable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    ...process.platform === 'darwin' && { closable: false, },
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    opacity: 1,
    // titleBarStyle: 'hiddenInset',
    transparent: true,
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
    }
  })
}
