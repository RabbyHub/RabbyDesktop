import { BrowserWindow } from 'electron';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from '../utils/app';
import { valueToMainSubject } from './_init';
import {
  getElectronChromeExtensions,
  getWebuiExtension,
} from '../utils/stream-helpers';

const getParentWindowOfTab = (tab: Electron.WebContents) => {
  switch (tab.getType()) {
    case 'window':
      return BrowserWindow.fromWebContents(tab);
    case 'browserView':
    case 'webview':
      // return tab.getOwnerBrowserWindow();
      return BrowserWindow.fromWebContents(tab);
    case 'backgroundPage':
      return BrowserWindow.getFocusedWindow();
    default:
      throw new Error(`Unable to find parent window of '${tab.getType()}'`);
  }
};

const windows: TabbedBrowserWindow[] = [];

let mainWindow: TabbedBrowserWindow;

export function getFocusedWindow() {
  return windows.find((w) => w.window.isFocused()) || windows[0];
}

export function getWindowFromBrowserWindow(window: BrowserWindow) {
  return !window?.isDestroyed()
    ? windows.find((win) => win.id === window.id)
    : null;
}

export function findByWindowId(
  windowId: BrowserWindow['id']
): TabbedBrowserWindow | undefined {
  return windows.find((w) => w.id === windowId);
}

export function getTabbedWindowFromWebContents(
  webContents: BrowserWindow['webContents']
) {
  const window = getParentWindowOfTab(webContents);
  return window ? getWindowFromBrowserWindow(window) : null;
}

// export function getIpcWindow(event: Electron.NewWindowWebContentsEvent) {
//   let win = null;

//   if ((event as any).sender) {
//     win = getTabbedWindowFromWebContents((event as any).sender);

//     // If sent from a popup window, we may need to get the parent window of the popup.
//     if (!win) {
//       const browserWindow = getParentWindowOfTab((event as any).sender);
//       if (browserWindow && !browserWindow.isDestroyed()) {
//         const parentWindow = browserWindow.getParentWindow();
//         if (parentWindow) {
//           win = getTabbedWindowFromWebContents(parentWindow.webContents);
//         }
//       }
//     }
//   }

//   return win;
// }

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
  windows.push(win);
  if (!mainWindow) {
    mainWindow = win;
    valueToMainSubject('mainWindowReady', mainWindow);
  }

  return win;
}

onIpcMainEvent('__internal_rpc:browser-dev:openDevTools', (evt) => {
  if (!IS_RUNTIME_PRODUCTION) {
    const webContents = evt.sender;
    webContents.openDevTools({ mode: 'detach' });
  }
});
