import { BrowserWindow } from 'electron';
import { NativeAppSizes } from '@/isomorphic/const-size-next';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { onIpcMainEvent, onIpcMainInternalEvent } from '../utils/ipcMainEvents';
import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from '../utils/app';
import {
  getElectronChromeExtensions,
  getWebuiExtension,
  onMainWindowReady,
  RABBYX_WINDOWID_S,
  toggleMaskViaOpenedRabbyxNotificationWindow,
} from '../utils/stream-helpers';
import { getWindowFromWebContents } from '../utils/browser';

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

export async function createRabbyxNotificationWindow({
  url,
  width,
  height,
}: {
  url: string;
  width?: number;
  height?: number;
}) {
  const mainWin = await onMainWindowReady();

  const mainBounds = mainWin.window.getBounds();
  const topOffset =
    (process.platform === 'win32' ? NativeAppSizes.windowTitlebarHeight : 0) +
    NativeAppSizes.mainWindowDappTopOffset;
  const win = await createWindow({
    defaultTabUrl: url,
    windowType: 'popup',
    isRabbyXNotificationWindow: true,
    window: {
      resizable: false,
      parent: mainWin.window,
      width: width || 400,
      height: height || mainBounds.height - topOffset,
      x: mainBounds.x + mainBounds.width - 400,
      y: mainBounds.y + topOffset,
      type: 'popup',
    },
  });

  RABBYX_WINDOWID_S.add(win.id);
  toggleMaskViaOpenedRabbyxNotificationWindow();

  return win.window as BrowserWindow;
}

onIpcMainEvent('__internal_rpc:browser-dev:openDevTools', (evt) => {
  if (!IS_RUNTIME_PRODUCTION) {
    const webContents = evt.sender;
    webContents.openDevTools({ mode: 'detach' });
  }
});

onIpcMainEvent('__internal_webui-window-close', (_, winId, webContentsId) => {
  const tabbedWindow = findByWindowId(winId);
  const tabToClose = tabbedWindow?.tabs.tabList.find((tab) => {
    if (tab.view && tab.view?.webContents.id === webContentsId) {
      return true;
    }
    return false;
  });
  tabToClose?.destroy();
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:make-sure-dapp-opened',
  async (evt, dappOrigin) => {
    const tabbedWin = await onMainWindowReady();

    const foundTab = tabbedWin.tabs.findByOrigin(dappOrigin);

    if (foundTab?.id && tabbedWin.tabs.selected?.id !== foundTab.id) {
      tabbedWin.tabs.select(foundTab.id);
    }
  }
);

onIpcMainInternalEvent('__internal_main:tabbed-window:destroyed', (winId) => {
  if (RABBYX_WINDOWID_S.has(winId)) {
    RABBYX_WINDOWID_S.delete(winId);
  }

  toggleMaskViaOpenedRabbyxNotificationWindow();
});
