import { BrowserWindow } from 'electron';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { EnumMatchDappType } from '@/isomorphic/constants';
import TabbedBrowserWindow, {
  MainTabbedBrowserWindow,
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from './app';
import {
  getElectronChromeExtensions,
  getWebuiExtension,
} from './stream-helpers';
import { getWindowFromWebContents } from './browser';

import { isEnableContentProtected } from '../store/desktopApp';
import { findDappsByOrigin, getAllDapps } from '../store/dapps';
import type { MainWindowTab } from '../browser/tabs';
import { sendToWebContents } from './ipcMainEvents';

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

export function checkoutTabbedWindow(
  webContents: BrowserWindow['webContents'],
  dapps: IDapp[] = getAllDapps()
) {
  const window = getWindowFromWebContents(webContents);
  const tabbedWindow = window ? getWindowFromBrowserWindow(window) : null;
  const webContentsDappTab = tabbedWindow?.tabs.tabList.find(
    (tab) => tab.view?.webContents.id === webContents.id
  );
  const matchedDappInfo = webContentsDappTab?.relatedDappId
    ? findDappsByOrigin(webContentsDappTab.relatedDappId, dapps)
    : null;

  return {
    parentWindow: window,
    tabbedWindow,
    webContentsDappTab,
    matchedDappInfo,
  };
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

export function createDappBoundDapp(
  mainTabbedWin: MainTabbedBrowserWindow,
  targetURL: string,
  matchedDapp: IMatchDappResult['dappByOrigin'] & object
) {
  const parsedInfo =
    typeof targetURL === 'string' ? canoicalizeDappUrl(targetURL) : targetURL;
  let openedTab: MainWindowTab | null = null;
  mainTabbedWin.tabs.tabList.find((tab) => {
    const dappInfo = tab.matchRelatedDappInfo(parsedInfo);
    if (dappInfo?.matchedType === EnumMatchDappType.byOrigin) {
      openedTab = tab;
    }

    return dappInfo;
  });

  if (!openedTab) {
    openedTab = mainTabbedWin.createTab({
      initDetails: { url: targetURL },
      relatedDappId: matchedDapp.id,
    });
  }

  sendToWebContents(
    mainTabbedWin.window.webContents,
    '__internal_push:mainwindow:opened-dapp-tab',
    {
      dappId: matchedDapp.id,
      tabId: openedTab.id,
      dappOrigin: matchedDapp.origin,
    }
  );

  return openedTab;
}

type IGetTabFromMainWindowResult = {
  finalTab: MainWindowTab | null;
  finalTabByOrigin: MainWindowTab | null;
  finalTabBySecondaryOrigin: MainWindowTab | null;
};
export function getOrCreateDappByURL(
  mainTabbedWin: MainTabbedBrowserWindow,
  targetURL: string,
  opts?: {
    targetMatchedDappResult: IMatchDappResult;
  }
): IGetTabFromMainWindowResult {
  const parsedInfo =
    typeof targetURL === 'string' ? canoicalizeDappUrl(targetURL) : targetURL;

  const result: IGetTabFromMainWindowResult = {
    finalTab: null,
    finalTabByOrigin: null,
    finalTabBySecondaryOrigin: null,
  };

  mainTabbedWin.tabs.tabList.find((tab) => {
    const dappInfo = tab.matchRelatedDappInfo(parsedInfo);
    if (dappInfo?.matchedType === EnumMatchDappType.byOrigin) {
      // eslint-disable-next-line no-multi-assign
      result.finalTabByOrigin = tab;
    } else if (dappInfo?.matchedType === EnumMatchDappType.bySecondaryDomain) {
      // eslint-disable-next-line no-multi-assign
      result.finalTabBySecondaryOrigin = tab;
    }

    return dappInfo;
  });

  let matchedDappResult = opts?.targetMatchedDappResult;
  if (!matchedDappResult) {
    matchedDappResult = findDappsByOrigin(parsedInfo.origin);
  }

  if (!matchedDappResult.dapp) return result;

  if (matchedDappResult.dappByOrigin) {
    result.finalTab = result.finalTabByOrigin;
  } else if (matchedDappResult.dappBySecondaryDomainOrigin) {
    result.finalTab = result.finalTabBySecondaryOrigin;
  }

  if (!(result.finalTabByOrigin || result.finalTabBySecondaryOrigin)) {
    const createdTab = mainTabbedWin.createTab({
      initDetails: { url: targetURL },
      relatedDappId: matchedDappResult.dapp.id,
    });

    result.finalTabByOrigin = result.finalTabByOrigin || createdTab;
    result.finalTab = createdTab;
  }

  // TODO: for existed tab, we should also push this event on another location
  if (result.finalTab) {
    const foundDapp = matchedDappResult.dapp;
    sendToWebContents(
      mainTabbedWin.window.webContents,
      '__internal_push:mainwindow:opened-dapp-tab',
      {
        dappId: foundDapp.id,
        tabId: result.finalTab?.id,
        dappOrigin: foundDapp.origin,
      }
    );
  }

  return result;
}
