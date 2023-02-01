import { BrowserView, BrowserWindow } from 'electron';

import {
  IS_RUNTIME_PRODUCTION,
  RABBY_MAIN_POPUP_VIEW,
} from '../../isomorphic/constants';

import { createPopupView } from '../utils/browser';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  getDappSafeView,
  getSessionInsts,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';
import { getAssetPath } from '../utils/app';
import { parseDappUrl } from '../store/dapps';
import { parseWebsiteFavicon } from '../utils/fetch';
import { getAppProxyConf } from '../store/desktopApp';

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

  baseView.webContents.loadURL(`${RABBY_MAIN_POPUP_VIEW}#/dapp-safe-view`);

  hideView(baseView, targetWin);

  valueToMainSubject('dappSafeModeViews', { baseView, safeView });
});

export async function attachDappSafeview(
  url: string,
  opts: {
    sourceURL: string;
    existedDapp?: IDapp | null;
    _targetwin?: BrowserWindow;
  }
) {
  const targetWin = opts._targetwin || (await onMainWindowReady()).window;
  const { baseView } = await getDappSafeView();
  const toExistedDapp = !!opts.existedDapp;

  sendToWebContents(
    baseView.webContents,
    '__internal_push:dapp-tabs:open-safe-view',
    {
      url,
      sourceURL: opts.sourceURL,
      toExistedDapp,
      status: 'start-loading',
      favIcon: {
        iconInfo: null,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${url}`,
      },
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

    const favIcon = await parseWebsiteFavicon(url, {
      timeout: 3000,
      proxy: proxyOnParseFavicon,
    });

    sendToWebContents(
      baseView.webContents,
      '__internal_push:dapp-tabs:open-safe-view',
      {
        url,
        sourceURL: opts.sourceURL,
        toExistedDapp,
        status: 'loaded',
        favIcon,
      }
    );
  } catch (e) {
    // TODO: deal with potential load failure here
  } finally {
    updateSubWindowPosition(targetWin, { baseView });
  }
}

onIpcMainEvent('__internal_rpc:dapp-tabs:close-safe-view', async () => {
  const targetWin = (await onMainWindowReady()).window;
  const dappSafeModeViews = await getDappSafeView();

  hideView(dappSafeModeViews.baseView, targetWin);
  hideView(dappSafeModeViews.safeView, targetWin);

  dappSafeModeViews.safeView.webContents.loadURL('about:blank');
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  switch (payload.type) {
    case 'dapp-safe-view:open': {
      attachDappSafeview('https://help.uniswap.org/en', {
        sourceURL: 'https://app.uniswap.org/',
      });
      break;
    }
    case 'dapp-safe-view:inspect': {
      const dappSafeModeViews = await getDappSafeView();
      if (payload.viewType === 'base') {
        dappSafeModeViews.baseView.webContents.openDevTools({
          mode: 'detach',
        });
      } else if (payload.viewType === 'safe') {
        dappSafeModeViews.safeView.webContents.openDevTools({
          mode: 'detach',
        });
      }

      break;
    }
    default:
      break;
  }
});
