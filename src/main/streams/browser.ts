import { matchURLHeadV2 } from '@/isomorphic/app-config';

import { trimWebContentsUserAgent } from '@/isomorphic/string';
import { dynamicConfigStore } from '../store/dynamicConfig';
import { onIpcMainEvent, onIpcMainInternalEvent } from '../utils/ipcMainEvents';
import { forwardToMainWebContents } from '../utils/stream-helpers';
import { getWindowFromBrowserWindow } from './tabbedBrowserWindow';
import { setListeners, setOpenHandlerForWebContents } from './webContents';

onIpcMainEvent(
  '__internal_forward:main-window:close-tab',
  async (_, tabId: number) => {
    forwardToMainWebContents('__internal_forward:main-window:close-tab', tabId);
  }
);

onIpcMainEvent('__internal_forward:main-window:close-all-tab', async () => {
  forwardToMainWebContents(
    '__internal_forward:main-window:close-all-tab',
    undefined
  );
});

onIpcMainEvent(
  '__internal_forward:main-window:create-dapp-tab',
  async (_, dappOrigin: string) => {
    forwardToMainWebContents(
      '__internal_forward:main-window:create-dapp-tab',
      dappOrigin
    );
  }
);

onIpcMainInternalEvent(
  '__internal_main:tabbed-window:view-added',
  ({ webContents, window, tabbedWindow }) => {
    // const isMainContentsForTabbedWindow = !!tabbedWindow;
    const tabbedWin = tabbedWindow || getWindowFromBrowserWindow(window);
    if (!tabbedWin) return;

    setListeners['will-redirect'](webContents);
    setListeners['will-navigate'](webContents, window);

    setOpenHandlerForWebContents({
      webContents,
      parentTabbedWin: tabbedWin,
    });
  }
);

onIpcMainInternalEvent(
  '__internal_main:tabbed-window:tab-added',
  ({ relatedDappId, webContents }) => {
    if (!relatedDappId) return;
    const domain_metas = dynamicConfigStore.get('domain_metas');

    const matchResult = matchURLHeadV2(relatedDappId, domain_metas?.url_head);

    /**
     * @description though we have inject `window.ethereum` to dapp's webContents,
     * some dapp don't allow electron-based application to connect web3 wallet as they think it's unsafe.
     *
     * there are two kinds methods to detect if browser is electron-based:
     * 1. check the `window.navigator.userAgent`
     * 2. run some javascript to detect feature only electron-based browser has
     *
     * for the first case, we can set webContents' user agent to simulate browser.
     *
     * **NOTICE** this would not change the value `window.navigator.userAgent` in dapp's devTools console,
     * BUT it would change the value `navigator.userAgent` in dapp's javascript.
     */
    if (matchResult?.finalMatchedConf?.shouldSimulateBrowser) {
      const targetUA = trimWebContentsUserAgent(
        webContents.session.getUserAgent(),
        { simulateBrowser: true }
      );
      webContents.setUserAgent(targetUA);
    }
  }
);
