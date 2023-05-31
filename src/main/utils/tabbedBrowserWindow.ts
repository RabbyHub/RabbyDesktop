import { BrowserWindow } from 'electron';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import { EnumMatchDappType } from '@/isomorphic/constants';
import { checkoutDappURL } from '@/isomorphic/dapp';
import TabbedBrowserWindow, {
  MainTabbedBrowserWindow,
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from './app';
import {
  RABBYX_WINDOWID_S,
  getAllMainUIViews,
  getElectronChromeExtensions,
  getWebuiExtension,
} from './stream-helpers';
import { getWindowFromWebContents } from './browser';

import {
  getMainWindowDappViewZoomPercent,
  isEnableContentProtected,
} from '../store/desktopApp';
import { findDappsByOrigin, getAllDapps } from '../store/dapps';
import { Tab } from '../browser/tabs';
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
  const foundTab = tabbedWindow?.tabs.tabList.find(
    (tab) => tab.view?.webContents.id === webContents.id
  );
  const matchedDappInfo = foundTab?.relatedDappId
    ? findDappsByOrigin(foundTab.relatedDappId, dapps)
    : null;

  return {
    parentWindow: window,
    tabbedWindow,
    foundTab,
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

type IGetTabFromMainWindowResult = {
  foundMatchedDapp: IDapp | null;
  existedTab: Tab | null;
  createdTab: Tab | null;
  finalTab: Tab | null;
};
export function getOrCreateDappBoundTab(
  mainTabbedWin: MainTabbedBrowserWindow,
  targetURL: string,
  opts?: {
    targetMatchedDappResult: IMatchDappResult;
  }
): IGetTabFromMainWindowResult {
  const parsedInfo =
    typeof targetURL === 'string' ? canoicalizeDappUrl(targetURL) : targetURL;

  const result = {
    foundMatchedDapp: null as IDapp | null,
    existedTab: null as Tab | null,
    createdTab: null as Tab | null,
    finalTab: null as Tab | null,
  };

  let existedTab = null as Tab | null;
  mainTabbedWin.tabs.tabList.find((tab) => {
    const dappInfo = tab.matchRelatedDappInfo(parsedInfo);
    if (dappInfo?.matchedType === EnumMatchDappType.byOrigin) {
      existedTab = tab;
    } else if (dappInfo?.matchedType === EnumMatchDappType.bySecondaryDomain) {
      existedTab = tab;
    }

    return dappInfo;
  });

  // eslint-disable-next-line no-multi-assign
  result.finalTab = result.existedTab = existedTab || null;

  let matchedDappResult = opts?.targetMatchedDappResult;
  if (!matchedDappResult) {
    matchedDappResult = findDappsByOrigin(parsedInfo.origin);
  }

  result.foundMatchedDapp = matchedDappResult?.dapp || null;

  if (!matchedDappResult.dapp) return result;

  if (!existedTab) {
    const createdTab = mainTabbedWin.createTab({
      initDetails: { url: targetURL },
      relatedDappId: checkoutDappURL(matchedDappResult.dapp.origin).dappHttpID,
      dappZoomPercent: getMainWindowDappViewZoomPercent(),
    });

    result.createdTab = createdTab;
    result.finalTab = createdTab || existedTab || null;
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

function getAllRabbyXWindowWebContentsList() {
  const webContentsList: Electron.WebContents[] = [];

  RABBYX_WINDOWID_S.forEach((windowId) => {
    if (!windowId) return;

    const win = BrowserWindow.fromId(windowId);
    if (!win || win?.isDestroyed()) return;
    const tabbedBrowserWindow = getTabbedWindowFromWebContents(
      win?.webContents
    );

    // find all rabbyx sign tabs
    tabbedBrowserWindow?.tabs.tabList.forEach((tab) => {
      if (tab.view?.webContents && !tab.view?.webContents.isDestroyed()) {
        webContentsList.push(tab.view?.webContents);
      }
    });
  });

  return webContentsList;
}

export async function pushEventToAllUIsCareAboutHidDevices(
  eventPayload: M2RChanneMessagePayload['__internal_push:webusb:events']
) {
  const { list } = await getAllMainUIViews();
  const rabbyxSignWebContentsList = getAllRabbyXWindowWebContentsList();

  [...list, ...rabbyxSignWebContentsList].forEach((view) => {
    sendToWebContents(view, '__internal_push:webusb:events', eventPayload);
  });
}
