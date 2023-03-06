import { BrowserView, BrowserWindow } from 'electron';

import { canoicalizeDappUrl } from '@/isomorphic/url';
import {
  IS_RUNTIME_PRODUCTION,
  RABBY_POPUP_GHOST_VIEW_URL,
} from '../../isomorphic/constants';

import {
  createPopupView,
  hidePopupView,
  switchToBrowserTab,
} from '../utils/browser';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  forwardToMainWebContents,
  getDappSafeView,
  getSessionInsts,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import { getAssetPath } from '../utils/app';
import { parseWebsiteFavicon } from '../utils/fetch';
import { getAppProxyConf } from '../store/desktopApp';
import { findDappsByOrigin } from '../store/dapps';

function hideView(view: BrowserView, parentWin: BrowserWindow) {
  parentWin.removeBrowserView(view);
}

function isViewHidden(view: BrowserView) {
  const win = BrowserWindow.fromBrowserView(view);
  return !win;
}

function updateSubWindowPosition(
  parentWin: BrowserWindow,
  views: {
    baseView: BrowserView;
    // safeView: BrowserView;
  }
) {
  const [width, height] = parentWin.getSize();

  views.baseView.setBounds({
    x: 0,
    y: 0,
    width,
    height,
  });
}

onMainWindowReady().then(async (mainWin) => {
  const targetWin = mainWin.window;

  const baseView = createPopupView({});

  updateSubWindowPosition(mainWin.window, { baseView });
  const onTargetWinUpdate = () => {
    if (isViewHidden(baseView)) return;
    // if (isViewHidden(safeView)) return;
    updateSubWindowPosition(mainWin.window, { baseView });
  };
  targetWin.on('show', onTargetWinUpdate);
  targetWin.on('move', onTargetWinUpdate);
  targetWin.on('resize', onTargetWinUpdate);
  targetWin.on('resized', onTargetWinUpdate);
  targetWin.on('unmaximize', onTargetWinUpdate);
  targetWin.on('restore', onTargetWinUpdate);

  baseView.webContents.loadURL(
    `${RABBY_POPUP_GHOST_VIEW_URL}?view=dapp-safe-view#/`
  );

  hideView(baseView, targetWin);

  valueToMainSubject('dappSafeModeViews', { baseView });
});

function defaultActiveTabNoop() {}
type SafeOpenResult = {
  activeTab: () => void;
} & (
  | {
      type: 'alert-user';
    }
  | {
      type: 'switch-to-opened-tab';
      openedTab: import('../browser/tabs').Tab;
      shouldLoad?: boolean;
    }
  | {
      type: 'create-tab';
    }
);
/**
 * @description
 * workflow:
 * 1. if allowed dapp
 *  - try to find opened tab by secondary domain, if found, switch to it
 *  - else, create a new tab
 * 2. if not allowed dapp
 *  - alert user to add it
 * @param targetURL
 * @param opts
 * @returns
 */
export async function safeOpenURL(
  targetURL: string,
  opts: {
    sourceURL: string;
    existedDapp?: IDapp | null;
    existedMainDomainDapp?: IDapp | null;
    _targetwin?: BrowserWindow;
  }
): Promise<SafeOpenResult> {
  const mainTabbedWin = await onMainWindowReady();
  if (opts.existedDapp || opts.existedMainDomainDapp) {
    const openedTab = mainTabbedWin.tabs.findBySecondaryDomain(targetURL);
    if (openedTab?.view) {
      const currentURL = openedTab.view.webContents.getURL();
      const shouldLoad =
        canoicalizeDappUrl(targetURL).origin !==
        canoicalizeDappUrl(currentURL).origin;

      return {
        type: 'switch-to-opened-tab',
        openedTab,
        activeTab: () => {
          if (shouldLoad) {
            openedTab.view?.webContents.loadURL(targetURL);
          }
          switchToBrowserTab(openedTab.id, mainTabbedWin);
        },
        shouldLoad,
      };
    }

    forwardToMainWebContents(
      '__internal_forward:main-window:create-dapp-tab',
      targetURL
    );

    return {
      type: 'create-tab',
      activeTab: defaultActiveTabNoop,
    };
  }

  // start: for non-added dapp, alert user to add it
  const targetWin = opts._targetwin || (await onMainWindowReady()).window;

  const { baseView } = await getDappSafeView();
  let favIcon: IParsedFavicon = {
    iconInfo: null,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${targetURL}`,
  };
  sendToWebContents(
    baseView.webContents,
    '__internal_push:dapp-tabs:open-safe-view',
    {
      url: targetURL,
      sourceURL: opts.sourceURL,
      status: 'start-loading',
      favIcon,
    }
  );

  targetWin.addBrowserView(baseView);
  targetWin.setTopBrowserView(baseView);
  updateSubWindowPosition(targetWin, { baseView });

  try {
    const proxyConf = getAppProxyConf();
    const proxyOnParseFavicon =
      proxyConf.proxyType === 'custom'
        ? {
            protocol: proxyConf.proxySettings.protocol,
            host: proxyConf.proxySettings.hostname,
            port: proxyConf.proxySettings.port,
          }
        : undefined;

    favIcon = await parseWebsiteFavicon(targetURL, {
      timeout: 3000,
      proxy: proxyOnParseFavicon,
    });
  } catch (e) {
    // TODO: deal with potential load failure here
    console.error(e);
  } finally {
    sendToWebContents(
      baseView.webContents,
      '__internal_push:dapp-tabs:open-safe-view',
      {
        url: targetURL,
        sourceURL: opts.sourceURL,
        status: 'loaded',
        favIcon,
      }
    );
  }

  return {
    type: 'alert-user',
    activeTab: defaultActiveTabNoop,
  };
}

const dappPreviewViewReady = onMainWindowReady().then(async (tabbedMainWin) => {
  const { dappSafeViewSession } = await getSessionInsts();

  // TODO: stop it interacting with wallet by default
  const safeView = createPopupView({
    webPreferences: {
      session: dappSafeViewSession,
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
      autoplayPolicy: 'user-gesture-required',
      preload: getAssetPath(`./preloads/dappSafeViewPreload.js`),
      safeDialogs: true,
      disableDialogs: true,
      devTools: !IS_RUNTIME_PRODUCTION,
    },
  });

  tabbedMainWin.window.addBrowserView(safeView);
  hidePopupView(safeView);

  return safeView;
});

onIpcMainEvent('__internal_rpc:dapp-tabs:close-safe-view', async () => {
  const targetWin = (await onMainWindowReady()).window;
  const dappSafeModeViews = await getDappSafeView();

  hideView(dappSafeModeViews.baseView, targetWin);
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  switch (payload.type) {
    case 'dapp-safe-view:open': {
      const targetOrigin = 'https://help.uniswap.org/en';
      const findResult = findDappsByOrigin(targetOrigin);

      safeOpenURL(targetOrigin, {
        sourceURL: 'https://app.uniswap.org/',
        existedDapp: findResult.dappByOrigin,
        existedMainDomainDapp: findResult.dappBySecondaryDomainOrigin,
      }).then((res) => res.activeTab());
      break;
    }
    case 'dapp-safe-view:inspect': {
      const dappSafeModeViews = await getDappSafeView();
      if (payload.viewType === 'base') {
        dappSafeModeViews.baseView.webContents.openDevTools({
          mode: 'detach',
        });
      }

      break;
    }
    default:
      break;
  }
});

onIpcMainEvent(
  '__internal_rpc:preview-dapp-frame:toggle-show',
  async (_, payload) => {
    const dappPreviewView = await dappPreviewViewReady;
    const parentWin = (await onMainWindowReady()).window;

    switch (payload.dappViewState) {
      case 'mounted': {
        const rect = {
          x: Math.floor(payload.rect.x),
          y: Math.floor(payload.rect.y),
          width: Math.floor(payload.rect.width),
          height: Math.floor(payload.rect.height),
        };
        dappPreviewView.setBounds(rect);
        dappPreviewView.webContents.loadURL(payload.dappURL);

        parentWin.setTopBrowserView(dappPreviewView);
        break;
      }
      case 'unmounted': {
        hidePopupView(dappPreviewView);
        break;
      }
      default: {
        break;
      }
    }
  }
);
