import { BrowserWindow } from 'electron';

import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from './app';
import {
  getElectronChromeExtensions,
  getWebuiExtension,
  onMainWindowReady,
  RABBYX_WINDOWID_S,
  toggleMaskViaOpenedRabbyxNotificationWindow,
} from './stream-helpers';
import {
  getRabbyxNotificationBounds,
  getWindowFromWebContents,
} from './browser';

import { isEnableContentProtected } from '../store/desktopApp';

const windows: TabbedBrowserWindow[] = [];

export function getFocusedWindow() {
  return windows.find((w) => w.window.isFocused()) || windows[0];
}

export function getWindowFromBrowserWindow(window: BrowserWindow) {
  return window && !window.isDestroyed()
    ? windows.find((win) => win.id === window.id)
    : null;
}

export function findByWindowId(
  windowId: BrowserWindow['id']
): TabbedBrowserWindow | undefined {
  return windows.find((w) => w.id === windowId);
}

export function findOpenedDappTab(
  tabbedWin: TabbedBrowserWindow,
  url: string,
  byUrlbase = false
) {
  return !byUrlbase
    ? tabbedWin?.tabs.findByOrigin(url)
    : tabbedWin?.tabs.findByUrlbase(url);
}

export function findExistedRabbyxNotificationWin():
  | TabbedBrowserWindow
  | undefined {
  return windows.find((w) => w.isRabbyXNotificationWindow());
}

export function getTabbedWindowFromWebContents(
  webContents: BrowserWindow['webContents']
): TabbedBrowserWindow | null | undefined {
  const window = getWindowFromWebContents(webContents);
  return window ? getWindowFromBrowserWindow(window) : null;
}

export function isTabbedWebContents(webContents: Electron.WebContents) {
  return !!getTabbedWindowFromWebContents(webContents);
}

export async function createWindow(
  options: Partial<TabbedBrowserWindowOptions>
) {
  const webuiExtensionId = (await getWebuiExtension()).id;
  if (!webuiExtensionId) {
    throw new Error('[createWindow] webuiExtensionId is not set');
  }
  const win = new TabbedBrowserWindow({
    ...options,
    webuiExtensionId,
    extensions: await getElectronChromeExtensions(),
    window: getBrowserWindowOpts(options.window),
  });

  if (isEnableContentProtected()) {
    win.window.setContentProtection(true);
  }

  windows.push(win);

  return win;
}

export async function removeWindowRecord(win: Electron.BrowserWindow) {
  const tabbedWin = getWindowFromBrowserWindow(win);
  if (!tabbedWin) return;

  const index = windows.indexOf(tabbedWin);
  if (index >= 0) {
    windows.splice(index, 1);
  }

  return tabbedWin;
}

const isWin32 = process.platform === 'win32';

export async function createRabbyxNotificationWindow({
  url,
  width,
}: {
  url: string;
  width?: number;
  height?: number;
}) {
  const mainWin = await onMainWindowReady();

  const expectedBounds = getRabbyxNotificationBounds(mainWin.window);

  const win = await createWindow({
    defaultTabUrl: url,
    windowType: 'popup',
    isRabbyXNotificationWindow: true,
    window: {
      frame: false,
      /**
       * @notice by default, set transparent to true will
       * lead all click behavior to be ignored (passthrough),
       *
       * but in this case, we provide a popup-view as gasket, which is
       * under this window and above the main window, so we can set
       * transparent to true and make borderless-style window.
       */
      transparent: true,
      ...(!isWin32 && {
        roundedCorners: true,
        hasShadow: false,
      }),
      movable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      resizable: false,
      parent: mainWin.window,
      width: Math.min(width || expectedBounds.width, expectedBounds.width),
      height: expectedBounds.height,
      x: expectedBounds.x,
      y: expectedBounds.y,
      type: 'popup',
    },
  });

  const windowId = win.window.id;
  win.window.on('closed', () => {
    RABBYX_WINDOWID_S.delete(windowId);
    toggleMaskViaOpenedRabbyxNotificationWindow();
  });

  win.tabs.tabList[0]?._patchWindowClose();

  RABBYX_WINDOWID_S.add(windowId);
  toggleMaskViaOpenedRabbyxNotificationWindow();

  return win.window as BrowserWindow;
}
