import { BrowserWindow } from 'electron';

import {
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  forwardToMainWebContents,
  getAllMainUIViews,
  getAllMainUIWindows,
} from '../utils/stream-helpers';
import { getWindowFromBrowserWindow } from './tabbedBrowserWindow';
import { setListeners, setOpenHandlerForWebContents } from './webContents';

onIpcMainEvent(
  '__internal_rpc:browser:set-ignore-mouse-events',
  (event, ...args) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.setIgnoreMouseEvents(...args);
  }
);

onIpcMainEvent(
  '__internal_forward:main-window:close-tab',
  async (_, tabId: number) => {
    forwardToMainWebContents('__internal_forward:main-window:close-tab', tabId);
  }
);

onIpcMainEvent(
  '__internal_forward:main-window:open-dapp',
  async (_, dappOrigin: string) => {
    forwardToMainWebContents(
      '__internal_forward:main-window:open-dapp',
      dappOrigin
    );
  }
);

onIpcMainInternalEvent(
  '__internal_main:dapps:changed',
  async ({ dapps, pinnedList, unpinnedList, protocolDappsBinding }) => {
    const [{ windowList }, { viewOnlyList }] = await Promise.all([
      getAllMainUIWindows(),
      getAllMainUIViews(),
    ]);

    const viewSet = new Set([
      ...windowList.map((win) => win.webContents),
      ...viewOnlyList.map((view) => view),
    ]);

    viewSet.forEach((webContents) => {
      sendToWebContents(webContents, '__internal_push:dapps:changed', {
        dapps,
        pinnedList,
        unpinnedList,
        protocolDappsBinding,
      });
    });
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
