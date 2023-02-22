import { BrowserWindow } from 'electron';
import { bufferTime, fromEvent, map } from 'rxjs';

import { isUrlFromDapp, parseDomainMeta } from '@/isomorphic/url';
import { arraify } from '@/isomorphic/array';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';

import {
  getRabbyExtViews,
  onMainWindowReady,
  RABBYX_WINDOWID_S,
} from '../utils/stream-helpers';
import {
  getRabbyxNotificationBounds,
  isPopupWindowHidden,
} from '../utils/browser';
import { getOrPutCheckResult } from '../utils/dapps';
import { createDappTab } from './webContents';
import { dappStore, getAllDapps } from '../store/dapps';
import { cLog } from '../utils/log';

import {
  findByWindowId,
  getTabbedWindowFromWebContents,
} from '../utils/tabbedBrowserWindow';

/**
 * @deprecated import members from '../utils/tabbedBrowserWindow' instead
 */
export {
  getFocusedWindow,
  getWindowFromBrowserWindow,
  findByWindowId,
  findOpenedDappTab,
  findExistedRabbyxNotificationWin,
  getTabbedWindowFromWebContents,
  isTabbedWebContents,
  createWindow,
  removeWindowRecord,
  createRabbyxNotificationWindow,
} from '../utils/tabbedBrowserWindow';

onIpcMainEvent('__internal_rpc:rabbyx:close-signwin', async () => {
  RABBYX_WINDOWID_S.forEach((wid) => {
    const win = BrowserWindow.fromId(wid);
    if (win) win.close();
  });
});

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

    const isDestroyed = !tab.view || tab.view.webContents.isDestroyed();

    event.reply('__internal_rpc:webui-ext:navinfo', {
      reqid,
      tabNavInfo: {
        tabExists: !!tab,
        tabUrl,
        dappSecurityCheckResult: checkResult,
        canGoBack: isDestroyed ? false : !!tab.view?.webContents?.canGoBack(),
        canGoForward: isDestroyed
          ? false
          : !!tab.view?.webContents?.canGoForward(),
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

  const openedTab = mainTabbedWin.tabs.findByOrigin(dappOrigin);
  if (openedTab) {
    mainTabbedWin.tabs.select(openedTab.id);
    return;
  }

  createDappTab(mainTabbedWin, dappOrigin);
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:stop-tab-loading',
  async (_, tabId) => {
    const mainTabbedWin = await onMainWindowReady();

    const tab = mainTabbedWin.tabs.get(tabId);
    if (!tab) return;

    tab.view?.webContents.stop();
  }
);

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

onIpcMainInternalEvent(
  '__internal_main:mainwindow:sidebar-collapsed-changed',
  async () => {
    const mainWin = await onMainWindowReady();

    if (mainWin.tabs.selected) {
      // trigger re draw
      mainWin.tabs.selected.show();
    }
  }
);

onIpcMainInternalEvent(
  '__internal_main:app:close-tab-on-del-dapp',
  async (deledDappOrigins) => {
    const mainWin = await onMainWindowReady();

    let tabs: import('../browser/tabs').Tab[] = [];

    const dappOrigins = new Set(arraify(deledDappOrigins));
    const allDapps = getAllDapps();

    dappOrigins.forEach((dappOrigin) => {
      const domainMeta = parseDomainMeta(dappOrigin, allDapps, {});
      const isMainDomainAppWithoutSubDomainsDapp =
        domainMeta?.is2ndaryDomain && !domainMeta.subDomains.length;

      const tabsToClose = !isMainDomainAppWithoutSubDomainsDapp
        ? mainWin.tabs.findByOrigin(dappOrigin)
        : mainWin.tabs.filterTab((tabURL) => {
            const tabDomainMeta = parseDomainMeta(tabURL, allDapps, {});
            return tabDomainMeta.secondaryDomain === domainMeta.secondaryDomain;
          });

      if (tabsToClose) tabs = tabs.concat(tabsToClose);
    });

    tabs.forEach((tab) => {
      if (tab) {
        tab.destroy();
        cLog(`close-tab-on-del-dapp: destroyed tab ${tab.id}`);
      }
    });
  }
);

onIpcMainInternalEvent(
  '__internal_main:tabbed-window:tab-favicon-updated',
  async ({ dappOrigin, favicons }) => {
    const dappsMap = dappStore.get('dappsMap');

    const dappInfo = dappsMap[dappOrigin];

    if (!dappInfo) return;

    if (!dappInfo.faviconUrl && favicons[0]) {
      dappInfo.faviconUrl = favicons[0];
      dappStore.set('dappsMap', dappsMap);
    }
  }
);

onIpcMainEvent('__internal_rpc:trezor-like-window:click-close', async (evt) => {
  const { sender } = evt;
  const tabbedWin = getTabbedWindowFromWebContents(sender);
  if (!tabbedWin) return;

  tabbedWin.window.hide();

  const { backgroundWebContents } = await getRabbyExtViews();

  backgroundWebContents.executeJavaScript(`window._TrezorConnect.cancel();`);

  backgroundWebContents.executeJavaScript(`window._OnekeyConnect.cancel();`);

  tabbedWin.tabs.destroy();
});
