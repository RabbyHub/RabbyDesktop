import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { BrowserWindow, dialog } from 'electron';
import { formatZoomValue } from '@/isomorphic/primitive';
import type { MainWindowTab } from '../browser/tabs';
import { captureWebContents, hideLoadingView } from '../utils/browser';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { resizeImage } from '../utils/nativeImage';
import {
  checkIfWindowFullfilledScreen,
  getMainWinLastPosition,
  getWindowBoundsInWorkArea,
  setMainWindowBounds,
} from '../utils/screen';
import {
  getAllMainUIViews,
  getAppTray,
  getRabbyExtViews,
  onMainWindowReady,
  updateMainWindowActiveTabRect,
} from '../utils/stream-helpers';
import { getTabbedWindowFromWebContents } from './tabbedBrowserWindow';
import { desktopAppStore } from '../store/desktopApp';

const ResetDialogButtons = ['Cancel', 'Confirm'] as const;
const cancleId = ResetDialogButtons.findIndex((x) => x === 'Cancel');
const confirmId = ResetDialogButtons.findIndex((x) => x === 'Confirm');

export async function alertAutoUnlockFailed() {
  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'question',
    title: 'Reset Rabby',
    message: `You have set one password previously. Do you want to reset Rabby App and relauch without password?`,
    defaultId: cancleId,
    cancelId: cancleId,
    noLink: true,
    buttons: ResetDialogButtons as any as string[],
  });

  if (result.response === confirmId) {
    emitIpcMainEvent('__internal_main:app:reset-app');
  }
}

const isDarwin = process.platform === 'darwin';

onMainWindowReady().then(async (mainWin) => {
  const mainWindow = mainWin.window;
  let prevWindowState:
    | 'normal'
    | 'maximized'
    | 'minimized'
    | 'fullscreen'
    | void;

  // mainWindow.on('resize', () => {
  //   if (isDarwin && prevWindowState === 'maximized') {
  //     sendToWebContents(mainWindow.webContents, '__internal_push:mainwindow:state-changed', {
  //       windowState: (prevWindowState = 'normal'),
  //     });
  //   }
  // })

  mainWindow.on('maximize', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState = 'maximized'),
      }
    );
  });
  mainWindow.on('unmaximize', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState = 'normal'),
      }
    );
  });

  mainWindow.on('minimize', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState = 'minimized'),
      }
    );
  });

  mainWindow.on('restore', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState =
          isDarwin && prevWindowState === 'maximized'
            ? prevWindowState
            : 'normal'),
      }
    );
  });

  mainWindow.on('enter-full-screen', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState = 'fullscreen'),
      }
    );
  });
  mainWindow.on('leave-full-screen', () => {
    sendToWebContents(
      mainWindow.webContents,
      '__internal_push:mainwindow:state-changed',
      {
        windowState: (prevWindowState =
          isDarwin && prevWindowState === 'maximized'
            ? prevWindowState
            : 'normal'),
      }
    );
  });
});

function initMainWindowPosition(mainWindow: Electron.BrowserWindow) {
  const lastPos = getMainWinLastPosition();
  const expectedBounds = getWindowBoundsInWorkArea(lastPos);

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug(
      '[isInitMainWindow] lastPos, expectedBounds',
      lastPos,
      expectedBounds
    );
  }

  setMainWindowBounds(mainWindow, expectedBounds);
}

onIpcMainInternalEvent(
  '__internal_main:mainwindow:show',
  async (isInitMainWindow) => {
    await getRabbyExtViews();
    const mainTabbedWin = await onMainWindowReady();

    if (isInitMainWindow) {
      initMainWindowPosition(mainTabbedWin.window);
    }
    mainTabbedWin.window.show();
    mainTabbedWin.window.moveTop();
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:reload-tab',
  async (_, tabId, forceReload) => {
    const mainTabbedWin = await onMainWindowReady();

    const tab = mainTabbedWin.tabs.get(tabId);
    if (!tab) return;

    tab.reload(forceReload);
  }
);

const captureState = {
  image: null as Electron.NativeImage | null,
};
async function clearCaptureState() {
  const mainWin = await onMainWindowReady();

  captureState.image = null;
  sendToWebContents(
    mainWin.window.webContents,
    '__internal_push:mainwindow:got-dapp-screenshot',
    {
      imageBuf: null,
    }
  );
}
async function getLatestCapturedActiveTab() {
  const mainWin = await onMainWindowReady();

  const activeTab = mainWin.tabs.selected;
  if (!activeTab?.tabWebContents) return null;

  let latestOne = captureState.image;
  const imageP = captureWebContents(activeTab.tabWebContents).then((image) => {
    captureState.image = image ? resizeImage(image, 0.1) : null;

    return image;
  });

  if (!latestOne) {
    latestOne = await imageP;
  }

  if (latestOne) {
    sendToWebContents(
      mainWin.window.webContents,
      '__internal_push:mainwindow:got-dapp-screenshot',
      {
        imageBuf: latestOne.toPNG(),
      }
    );
  }

  return latestOne;
}

onIpcMainEvent('__internal_rpc:mainwindow:click-close', async (evt) => {
  const { sender } = evt;
  const tabbedWin = getTabbedWindowFromWebContents(sender);
  const mainTabbedWin = await onMainWindowReady();

  if (tabbedWin === mainTabbedWin) {
    mainTabbedWin.window.hide();
    const appTray = await getAppTray();

    if (!desktopAppStore.get('tipedHideMainWindowOnWindows', false)) {
      if (process.platform === 'win32') {
        appTray.displayBalloon({
          title: 'Rabby Desktop',
          iconType: 'info',
          content: `The application has been minimized to the Windows taskbar. You can click on the application icon to open it again.`,
          noSound: false,
          respectQuietTime: true,
        });
        desktopAppStore.set('tipedHideMainWindowOnWindows', true);
      } else if (process.platform === 'darwin') {
        // TODO: should we tooltip on macos?
        desktopAppStore.set('tipedHideMainWindowOnWindows', true);
      }
    }

    return;
  }

  tabbedWin?.window?.hide();
  tabbedWin?.destroy();
});

/**
 * @description useless now, it's cost too much time to capture the whole page on animating
 */
onIpcMainInternalEvent(
  '__internal_main:mainwindow:capture-tab',
  async (payload) => {
    if (payload?.type === 'clear') {
      clearCaptureState();
    } else {
      getLatestCapturedActiveTab();
    }
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:select-tab',
  async (_, winId, tabId) => {
    const mainTabbedWin = await onMainWindowReady();
    if (mainTabbedWin.window.id !== winId) return;

    await clearCaptureState();
    mainTabbedWin.tabs.select(tabId);
    mainTabbedWin.tabs.checkLoadingView();
    getLatestCapturedActiveTab();
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:unconfirmed-unselect-all',
  async (_) => {
    const mainTabbedWin = await onMainWindowReady();

    mainTabbedWin.tabs.unSelectAll();
  }
);

handleIpcMainInvoke('toggle-activetab-animating', async (_, animating) => {
  const mainWin = await onMainWindowReady();

  const activeTab = mainWin.tabs.selected;
  if (!activeTab) return;

  activeTab.toggleAnimating(animating);
  const isLoading = !!activeTab.tabWebContents?.isLoading();

  if (!isLoading) {
    await getLatestCapturedActiveTab();
  } else {
    captureState.image = null;
  }

  mainWin.tabs.checkLoadingView();
});

onIpcMainEvent(
  '__internal_rpc:mainwindow:report-activeDapp-rect',
  async (_, reports) => {
    const mainTabbedWin = await onMainWindowReady();
    const activeTab = mainTabbedWin.tabs.selected;

    if (reports.dappViewState === 'mounted') {
      reports.rect.x = Math.round(reports.rect.x);
      reports.rect.y = Math.round(reports.rect.y);
      reports.rect.width = Math.round(reports.rect.width);
      reports.rect.height = Math.round(reports.rect.height);

      updateMainWindowActiveTabRect(reports);
      activeTab?.setAnimatedMainWindowTabRect(reports.rect);
    } else if (reports.dappViewState === 'unmounted') {
      updateMainWindowActiveTabRect({
        dappViewState: 'unmounted',
      });
      mainTabbedWin.tabs.unSelectAll();
      hideLoadingView();
    }
  }
);

const { handler: handlerOpenFindInPage } = onIpcMainInternalEvent(
  '__internal_main:mainwindow:op-find-in-page',
  async (payload) => {
    const mainTabbedWin = await onMainWindowReady();

    const currentTab = mainTabbedWin.tabs.selected as MainWindowTab;
    if (payload.type === 'stop-find') {
      currentTab?.resetFindInPage();
      return;
    }

    if (!currentTab?.tabWebContents) return;

    switch (payload.type) {
      case 'start-find': {
        const { views } = await getAllMainUIViews();
        const window = views['in-dapp-find'];
        currentTab.resumeFindInPage();

        setTimeout(() => {
          window.webContents.focus();
        }, 200);

        break;
      }
      case 'find-forward': {
        if (currentTab.findInPageState.requestId <= 0) return;

        currentTab.tabWebContents?.findInPage(
          currentTab.findInPageState.searchText,
          {
            forward: true,
            findNext: false,
          }
        );
        break;
      }
      case 'find-backward': {
        if (currentTab.findInPageState.requestId <= 0) return;

        currentTab.tabWebContents?.findInPage(
          currentTab.findInPageState.searchText,
          {
            forward: false,
            findNext: false,
          }
        );
        break;
      }
      case 'update-search-token': {
        const searchText = payload.token;

        if (!searchText) {
          currentTab.clearFindInPageResult();
          break;
        }

        currentTab.resumeFindInPage(searchText);
        break;
      }
      default:
        break;
    }
  }
);

onIpcMainInternalEvent(
  '__internal_main:mainwindow:sidebar-collapsed-changed',
  async () => {
    const mainWin = await onMainWindowReady();

    const currentTab = mainWin.tabs.selected as MainWindowTab;
    if (currentTab) {
      // trigger re draw
      currentTab.show();
    }
  }
);

onIpcMainEvent(
  '__internal_rpc:mainwindow:op-find-in-page',
  async (_, payload) => {
    handlerOpenFindInPage(payload);
  }
);

onIpcMainInternalEvent(
  '__internal_main:mainwindow:update-findresult-in-page',
  async (payload) => {
    const { views } = await getAllMainUIViews();
    sendToWebContents(
      views['in-dapp-find'].webContents,
      '__internal_push:mainwindow:update-findresult-in-page',
      payload
    );
  }
);

handleIpcMainInvoke('__outer_rpc:mainwindow:is-dapp-view', async (evt) => {
  const webContents = evt.sender;
  const mainTabbedWin = await onMainWindowReady();
  const foundTab = mainTabbedWin.tabs.tabList.find(
    (tab) => tab.tabWebContents === webContents
  );

  return {
    isDappView: !!foundTab,
  };
});

onIpcMainInternalEvent(
  '__internal_main:mainwindow:adjust-all-views-zoom-percent',
  async (zoomPercent) => {
    const mainTabbedWin = await onMainWindowReady();

    mainTabbedWin.tabs.tabList.forEach((tab) => {
      const webContents = tab.tabWebContents;
      if (!webContents) return;

      sendToWebContents(
        webContents,
        '__internal_push:mainwindow:set-dapp-view-zoom',
        {
          zoomPercent: formatZoomValue(zoomPercent).zoomPercent,
        }
      );
    });
  }
);

onIpcMainInternalEvent(
  '__internal_main:mainwindow:webContents-crashed',
  async () => {
    const mainTabbedWin = await onMainWindowReady();

    await dialog.showMessageBox(mainTabbedWin.window, {
      title: 'Error Occured',
      type: 'info',
      message: !IS_RUNTIME_PRODUCTION
        ? 'Opps! Some error occured. Save entry file to restart app.'
        : 'Opps! Some error occured. Click OK to relaunch Rabby Desktop.',
    });

    emitIpcMainEvent('__internal_main:app:relaunch');
  }
);

const darwinScrInfo = {
  lastScreenSizeBeforeMaximize: undefined as undefined | Electron.Rectangle,
};
handleIpcMainInvoke('restore-darwin-mainwin-bounds', async (evt) => {
  const mainTabbedWin = await onMainWindowReady();
  const mainWin = mainTabbedWin.window;

  if (BrowserWindow.fromWebContents(evt.sender) !== mainWin) return;

  const nextBounds = {
    ...mainWin.getBounds(),
    ...(darwinScrInfo.lastScreenSizeBeforeMaximize?.width !== undefined && {
      width: darwinScrInfo.lastScreenSizeBeforeMaximize?.width,
    }),
    ...(darwinScrInfo.lastScreenSizeBeforeMaximize?.height !== undefined && {
      height: darwinScrInfo.lastScreenSizeBeforeMaximize?.height,
    }),
    ...(darwinScrInfo.lastScreenSizeBeforeMaximize?.x !== undefined && {
      x: darwinScrInfo.lastScreenSizeBeforeMaximize?.x,
    }),
    ...(darwinScrInfo.lastScreenSizeBeforeMaximize?.y !== undefined && {
      y: darwinScrInfo.lastScreenSizeBeforeMaximize?.y,
    }),
  };

  setMainWindowBounds(mainWin, nextBounds, true);
});
handleIpcMainInvoke('memoize-darwin-mainwindow-screen-info', async (evt) => {
  const mainTabbedWin = await onMainWindowReady();
  const mainWin = mainTabbedWin.window;

  if (BrowserWindow.fromWebContents(evt.sender) !== mainWin) return;

  darwinScrInfo.lastScreenSizeBeforeMaximize = mainWin.getBounds();
});
handleIpcMainInvoke('get-darwin-mainwindow-screen-info', async (evt) => {
  const mainTabbedWin = await onMainWindowReady();
  const mainWin = mainTabbedWin.window;

  const { isDockFullfilled } = checkIfWindowFullfilledScreen(mainWin);

  return {
    isDockFullfilled,
    lastScreenSizeBeforeMaximize: darwinScrInfo.lastScreenSizeBeforeMaximize,
  };
});
