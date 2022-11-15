import { firstValueFrom } from 'rxjs';
import { app } from 'electron';
import { fromMainSubject, valueToMainSubject } from './_init';

import { cLog } from '../utils/log';
import { onIpcMainEvent, sendToWebContents } from '../utils/ipcMainEvents';
import { createPopupView } from '../utils/browser';
import { onMainWindowReady } from '../utils/stream-helpers';
import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import {
  RABBY_PANEL_SIZE,
  NATIVE_HEADER_WITH_NAV_H,
} from '../../isomorphic/const-size';
import { walletController } from './rabbyIpcQuery';
import { Tab } from '../browser/tabs';
import { rabbyxQuery } from './rabbyIpcQuery/_base';

export async function getRabbyExtId() {
  const ext = await firstValueFrom(fromMainSubject('rabbyExtension'));

  cLog('getRabbyExtId', ext.id);

  return ext.id;
}

export async function getRabbyExtViews() {
  return firstValueFrom(fromMainSubject('rabbyExtViews'));
}

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
    const connectedSites = await rabbyxQuery<IConnectedSiteInfo[]>(
      'walletController.getConnectedSites'
    );

    event.reply('__internal_rpc:webui-ext:get-connected-sites', {
      reqid,
      sites: connectedSites,
    });
  }
);

async function updateViewPosition(
  rabbyView: Electron.BrowserView,
  mainWin: Electron.BrowserWindow,
  type: 'side' | 'center' = 'side'
) {
  const [width, height] = mainWin.getSize();

  const popupRect =
    type === 'center'
      ? {
          x: Math.floor((width - RABBY_PANEL_SIZE.width) / 2),
          y: NATIVE_HEADER_WITH_NAV_H,
          width,
          height: height - NATIVE_HEADER_WITH_NAV_H,
        }
      : {
          x: width - RABBY_PANEL_SIZE.width,
          y: NATIVE_HEADER_WITH_NAV_H,
          width: RABBY_PANEL_SIZE.width,
          height: height - NATIVE_HEADER_WITH_NAV_H,
        };

  rabbyView.setBounds({ ...popupRect });

  mainWin.setTopBrowserView(rabbyView);
}

async function onLockStatusChange(nextLocked: boolean) {
  const tabbedWin = await onMainWindowReady();
  const { panelView } = await getRabbyExtViews();

  updateViewPosition(
    panelView,
    tabbedWin.window,
    nextLocked ? 'center' : 'side'
  );

  if (nextLocked) {
    tabbedWin.tabs.selected?.hide();
  } else {
    const nextSelected = tabbedWin.tabs.selected || tabbedWin.tabs.tabList[0];
    tabbedWin.tabs.select(nextSelected.id);
  }
}

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

getRabbyExtId().then(async (extId) => {
  const tabbedWin = await onMainWindowReady();
  const mainWin = tabbedWin.window;
  if (mainWin.isDestroyed()) return;

  const rabbyView = createPopupView();
  const rabbyBgHostView = createPopupView();

  mainWin.addBrowserView(rabbyView);
  mainWin.addBrowserView(rabbyBgHostView);

  updateViewPosition(rabbyView, mainWin);

  rabbyBgHostView.setBounds({ x: -9999, y: -1000, width: 1, height: 1 });
  rabbyBgHostView.webContents.loadURL(
    `chrome-extension://${extId}/background.html`
  );

  rabbyBgHostView.webContents.on('did-finish-load', () => {
    cLog('rabbyExtViews loaded');
    valueToMainSubject('rabbyExtViews', {
      panelView: rabbyView,
      backgroundHost: rabbyBgHostView.webContents,
    });
  });

  if (!IS_RUNTIME_PRODUCTION) {
    // rabbyBgHostView.webContents.openDevTools({ mode: 'detach' });
    // rabbyView.webContents.openDevTools({ mode: 'detach' });
    // tabbedWin.createTab({
    //   initialUrl: `https://metamask.github.io/test-dapp/`,
    // }).webContents!
    //   .openDevTools({ mode: 'bottom', activate: false });
  }

  const onTargetWinUpdate = () => {
    updateViewPosition(rabbyView, mainWin);
  };

  mainWin.on('show', onTargetWinUpdate);
  mainWin.on('move', onTargetWinUpdate);
  mainWin.on('resize', onTargetWinUpdate);
  mainWin.on('unmaximize', onTargetWinUpdate);
  mainWin.on('restore', onTargetWinUpdate);

  // wait for extension background initialized.
  // TODO: use specific event instead of timeout.
  setTimeout(() => {
    rabbyView.webContents.loadURL(`chrome-extension://${extId}/popup.html`);
  }, 5000);

  const isUnlocked = await walletController.isUnlocked();
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
          currentUrl = tab.webContents!.getURL();
          resolve(currentUrl);
        }
      });

      if (currentUrl) resolve(currentUrl);
    });

    if (!previousUrl) previousUrl = currentUrl;

    // panelView.webContents.openDevTools({ mode: 'detach' });

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
