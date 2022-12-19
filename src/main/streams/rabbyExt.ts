import { app } from 'electron';
import { valueToMainSubject } from './_init';

import { cLog } from '../utils/log';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { createPopupView } from '../utils/browser';
import {
  getRabbyExtId,
  getRabbyExtViews,
  onMainWindowReady,
} from '../utils/stream-helpers';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { RABBY_PANEL_SIZE } from '../../isomorphic/const-size';
import { NATIVE_HEADER_H } from '../../isomorphic/const-size-classical';
import { Tab } from '../browser/tabs';
import { rabbyxQuery } from './rabbyIpcQuery/_base';

onIpcMainEvent('rabby-extension-id', async (event) => {
  event.reply('rabby-extension-id', {
    rabbyExtensionId: await getRabbyExtId(),
  });
});

onIpcMainEvent('get-app-version', (event, reqid) => {
  event.reply('get-app-version', {
    reqid,
    version: app.getVersion(),
  });
});

onIpcMainEvent(
  '__internal_rpc:webui-ext:get-connected-sites',
  async (event, reqid) => {
    const connectedSites = await rabbyxQuery(
      'walletController.getConnectedSites'
    );

    event.reply('__internal_rpc:webui-ext:get-connected-sites', {
      reqid,
      sites: connectedSites,
    });
  }
);

let currentType: 'hide' | 'show' = 'hide';
async function updateViewPosition(
  rabbyView: Electron.BrowserView,
  mainWin: Electron.BrowserWindow
) {
  const [width, height] = mainWin.getSize();

  const popupRect =
    currentType === 'hide'
      ? {
          x: -9999,
          y: NATIVE_HEADER_H,
          width,
          height: height - NATIVE_HEADER_H,
        }
      : {
          x: width - RABBY_PANEL_SIZE.width,
          y: NATIVE_HEADER_H,
          width: RABBY_PANEL_SIZE.width,
          height: height - NATIVE_HEADER_H,
        };

  rabbyView.setBounds({ ...popupRect });
}

async function toggleRabbyPopup(nextShow: boolean) {
  const { panelView } = await getRabbyExtViews();
  const tabbedWin = await onMainWindowReady();
  const mainWin = tabbedWin.window;

  currentType = nextShow ? 'show' : 'hide';
  updateViewPosition(panelView, mainWin);

  if (nextShow) {
    mainWin.setTopBrowserView(panelView);
  }
}

async function onLockStatusChange(_nextLocked: boolean) {
  // const tabbedWin = await onMainWindowReady();
  // const { panelView } = await getRabbyExtViews();
  // currentType = nextLocked ? 'full' : 'side';
  // updateViewPosition(panelView, tabbedWin.window);
  // if (nextLocked) {
  //   tabbedWin.tabs.selected?.hide();
  // } else {
  //   const nextSelected = tabbedWin.tabs.selected || tabbedWin.tabs.tabList[0];
  //   tabbedWin.tabs.select(nextSelected.id);
  // }
}

// const eventsShouldPopup = [
//   'chainChanged',
//   'rabby:chainChanged',
//   'accountsChanged',
// ]

onIpcMainEvent(
  '__internal_rpc:rabbyx:on-session-broadcast',
  async (_, payload) => {
    const tabbedWin = await onMainWindowReady();
    // TODO: leave here for debug
    // console.log('[debug] payload', payload);

    switch (payload.event) {
      case 'rabby:chainChanged': {
        const { panelView } = await getRabbyExtViews();
        const data: IConnectedSiteToDisplay = {
          origin: payload.origin!,
          isConnected: !!payload.data?.hex,
          chainId: payload.data?.hex || '0x1',
          chainName: payload.data?.name || '',
        };
        sendToWebContents(
          tabbedWin.window.webContents,
          '__internal_push:rabby:chainChanged',
          data
        );
        sendToWebContents(
          panelView.webContents,
          '__internal_push:rabby:chainChanged',
          data
        );
        break;
      }
      case 'lock': {
        onLockStatusChange(true);
        break;
      }
      case 'unlock': {
        onLockStatusChange(false);
        break;
      }
      default:
        break;
    }
  }
);

onIpcMainEvent('__internal_rpc:rabbyx:toggleShow', async (_, nextShow) => {
  await toggleRabbyPopup(nextShow);
});

getRabbyExtId().then(async (extId) => {
  const tabbedWin = await onMainWindowReady();
  const mainWin = tabbedWin.window;
  if (mainWin.isDestroyed()) return;

  // const rabbyView = createPopupView();
  const rabbyBgHostView = createPopupView();

  // mainWin.addBrowserView(rabbyView);
  mainWin.addBrowserView(rabbyBgHostView);

  // updateViewPosition(rabbyView, mainWin);

  rabbyBgHostView.setBounds({ x: -9999, y: -1000, width: 1, height: 1 });
  rabbyBgHostView.webContents.loadURL(
    `chrome-extension://${extId}/background.html`
  );

  rabbyBgHostView.webContents.on('did-finish-load', () => {
    cLog('rabbyExtViews loaded');
    valueToMainSubject('rabbyExtViews', {
      // panelView: rabbyView,
      panelView: null as any,
      backgroundHost: rabbyBgHostView.webContents,
    });
  });

  if (!IS_RUNTIME_PRODUCTION) {
    rabbyBgHostView.webContents.openDevTools({ mode: 'detach' });
    // rabbyView.webContents.openDevTools({ mode: 'detach' });
    // tabbedWin.createTab({
    //   initialUrl: `https://metamask.github.io/test-dapp/`,
    // }).webContents!
    //   .openDevTools({ mode: 'bottom', activate: false });
  }

  const onTargetWinUpdate = () => {
    // updateViewPosition(rabbyView, mainWin);
  };

  mainWin.on('show', onTargetWinUpdate);
  mainWin.on('move', onTargetWinUpdate);
  mainWin.on('resize', onTargetWinUpdate);
  mainWin.on('unmaximize', onTargetWinUpdate);
  mainWin.on('restore', onTargetWinUpdate);

  // wait for extension background initialized.
  // TODO: use specific event instead of timeout.
  setTimeout(() => {
    // rabbyView.webContents.loadURL(`chrome-extension://${extId}/popup.html`);
  }, 5000);

  const isUnlocked = await rabbyxQuery('walletController.isUnlocked');
  onLockStatusChange(!isUnlocked);
});

getRabbyExtViews().then(async (views) => {
  const { panelView } = views;
  const tabbedWin = await onMainWindowReady();

  let previousUrl = '';
  tabbedWin.tabs.on('tab-selected', async (tab: Tab) => {
    if (!tab.webContents) return;

    // const previousUrl = previous?.webContents?.getURL() || '';
    let currentUrl = tab.webContents.getURL() || tab.getInitialUrl() || '';

    await new Promise((resolve) => {
      currentUrl = tab.webContents!.getURL() || '';

      tab.webContents!.on('did-finish-load', () => {
        if (!currentUrl) {
          currentUrl = tab.webContents?.getURL() || '';
          resolve(currentUrl);
        }
      });

      if (currentUrl) resolve(currentUrl);
    });

    if (!previousUrl) previousUrl = currentUrl;

    // panelView.webContents.openDevTools({ mode: 'detach' });

    if (panelView.webContents)
      sendToWebContents(
        panelView.webContents,
        '__internal_push:rabbyx:focusing-dapp-changed',
        {
          previousUrl,
          currentUrl,
        }
      );
  });
});
