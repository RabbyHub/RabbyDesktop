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
