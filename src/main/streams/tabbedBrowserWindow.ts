import { BrowserWindow } from 'electron';
import { bufferTime, fromEvent, map } from 'rxjs';

import { isUrlFromDapp } from '@/isomorphic/url';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
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
import {
  getRabbyxNotificationBounds,
  getWindowFromWebContents,
  isPopupWindowHidden,
} from '../utils/browser';
import { getOrPutCheckResult } from '../utils/dapps';
import { createDappTab } from './webContents';

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

  RABBYX_WINDOWID_S.add(win.id);
  toggleMaskViaOpenedRabbyxNotificationWindow();

  return win.window as BrowserWindow;
}

onIpcMainEvent(
  '__internal_rpc:webui-ext:navinfo',
  async (event, reqid, tabId) => {
    const webContents = event.sender;
    const tabbedWin = getTabbedWindowFromWebContents(webContents);
    if (!tabbedWin) return;

    const tab = tabbedWin.tabs.get(tabId);
    // TODO: always respond message
    if (!tab || !tab.view) return;

    const tabUrl = tab.view.webContents!.getURL();
    const checkResult = isUrlFromDapp(tabUrl)
      ? await getOrPutCheckResult(tabUrl, { updateOnSet: false })
      : null;

    event.reply('__internal_rpc:webui-ext:navinfo', {
      reqid,
      tabNavInfo: {
        tabExists: !!tab,
        tabUrl,
        dappSecurityCheckResult: checkResult,
        canGoBack: tab.view.webContents?.canGoBack(),
        canGoForward: tab.view.webContents?.canGoForward(),
      },
    });
  }
);

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

onIpcMainEvent('__internal_rpc:mainwindow:open-tab', async (_, dappOrigin) => {
  const mainTabbedWin = await onMainWindowReady();

  createDappTab(mainTabbedWin, dappOrigin);
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:select-tab',
  async (_, winId, tabId) => {
    const mainTabbedWin = await onMainWindowReady();
    if (mainTabbedWin.window.id !== winId) return;

    mainTabbedWin?.tabs.select(tabId);
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:stop-tab-loading',
  async (_, tabId) => {
    const mainTabbedWin = await onMainWindowReady();

    const tab = mainTabbedWin.tabs.get(tabId);
    if (!tab) return;

    tab.view?.webContents.stop();
  }
);

onIpcMainEvent('__internal_rpc:mainwindow:hide-all-tabs', async (_, winId) => {
  const mainTabbedWin = await onMainWindowReady();
  if (mainTabbedWin.window.id !== winId) return;

  mainTabbedWin.tabs.unSelectAll();
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:make-sure-dapp-opened',
  async (_, dappOrigin) => {
    const tabbedWin = await onMainWindowReady();

    const foundTab = tabbedWin.tabs.findByOrigin(dappOrigin);

    if (foundTab?.id && tabbedWin.tabs.selected?.id !== foundTab.id) {
      tabbedWin.tabs.select(foundTab.id);
    }
  }
);

onMainWindowReady().then((mainTabbedWin) => {
  mainTabbedWin.tabs.on('all-tabs-destroyed', () => {
    sendToWebContents(
      mainTabbedWin.window.webContents,
      '__internal_push:mainwindow:all-tabs-closed',
      {
        windowId: mainTabbedWin.window.id,
      }
    );
  });
});

// performance optimization
if (process.platform === 'win32') {
  onMainWindowReady().then((mainTabbedWin) => {
    const mainWindow = mainTabbedWin.window;

    const sub = fromEvent(mainWindow, 'move')
      .pipe(
        bufferTime(200),
        map((events) => events.length)
      )
      .subscribe((count) => {
        const activeTab = mainTabbedWin.tabs.selected;
        if (!mainWindow) return;
        if (!activeTab?.view || activeTab.view.webContents.isDestroyed())
          return;

        if (count > 1) {
          if (!activeTab?.view) return;
          if (activeTab.view.webContents.isLoading()) return;

          activeTab.hide();
        } else {
          if (!activeTab?.view) return;
          activeTab.show();
        }
      });

    mainWindow.on('close', () => {
      sub.unsubscribe();
    });
  });
}
onMainWindowReady().then((mainTabbedWin) => {
  if (!isWin32) return;

  const onTargetWinUpdate = () => {
    if (mainTabbedWin.window.isDestroyed()) return;

    RABBYX_WINDOWID_S.forEach((winId) => {
      const win = findByWindowId(winId)?.window;
      if (!win || win?.isDestroyed()) return;
      if (isPopupWindowHidden(win)) return;

      win.setBounds(getRabbyxNotificationBounds(mainTabbedWin.window));
    });
  };

  mainTabbedWin.window.on('show', onTargetWinUpdate);
  mainTabbedWin.window.on('move', onTargetWinUpdate);
  mainTabbedWin.window.on('resize', onTargetWinUpdate);
  mainTabbedWin.window.on('unmaximize', onTargetWinUpdate);
  mainTabbedWin.window.on('restore', onTargetWinUpdate);
});

onIpcMainInternalEvent('__internal_main:tabbed-window:destroyed', (winId) => {
  if (RABBYX_WINDOWID_S.has(winId)) {
    RABBYX_WINDOWID_S.delete(winId);
  }

  toggleMaskViaOpenedRabbyxNotificationWindow();
});
