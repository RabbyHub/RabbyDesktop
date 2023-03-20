import { BrowserWindow } from 'electron';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import TabbedBrowserWindow, {
  TabbedBrowserWindowOptions,
} from '../browser/browsers';
import { getBrowserWindowOpts } from './app';
import {
  getElectronChromeExtensions,
  getWebuiExtension,
} from './stream-helpers';
import { getWindowFromWebContents } from './browser';

import { isEnableContentProtected } from '../store/desktopApp';
import { findDappsByOrigin } from '../store/dapps';
import { Tab } from '../browser/tabs';

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

export function getOrCreateDappBoundTab(
  mainTabbedWin: TabbedBrowserWindow,
  targetURL: string,
  opts?: {
    foundDapp: IDapp | null;
  }
) {
  const parsedInfo =
    typeof targetURL === 'string' ? canoicalizeDappUrl(targetURL) : targetURL;

  let existedTab: Tab | null = null;
  mainTabbedWin.tabs.tabList.find((tab) => {
    const dappInfo = tab.getRelatedDappInfo(parsedInfo);
    if (dappInfo?.matchedType === 'by-origin') {
      existedTab = tab;
    } else if (dappInfo?.matchedType === 'by-secondary-domain') {
      existedTab = tab;
    }

    return dappInfo;
  });

  if (existedTab) return existedTab;

  let foundDapp = opts?.foundDapp;
  if (foundDapp === undefined) {
    const findResult = findDappsByOrigin(parsedInfo.origin);
    foundDapp =
      findResult.dappByOrigin || findResult.dappBySecondaryDomainOrigin;
  }

  if (!foundDapp) return null;

  return mainTabbedWin.createTab({
    initDetails: { url: targetURL },
    relatedDappId: foundDapp.id,
  });
}
