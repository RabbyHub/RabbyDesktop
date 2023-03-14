import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { dialog } from 'electron';
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
  getMainWinLastPosition,
  getWindowBoundsInWorkArea,
  setMainWindowBounds,
} from '../utils/screen';
import {
  getRabbyExtViews,
  onMainWindowReady,
  updateMainWindowActiveTabRect,
} from '../utils/stream-helpers';

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

onIpcMainEvent('__internal_rpc:mainwindow:reload-tab', async (_, tabId) => {
  const mainTabbedWin = await onMainWindowReady();

  const tab = mainTabbedWin.tabs.get(tabId);
  if (!tab) return;

  tab.reload();
});

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
  if (!activeTab?.view) return null;

  let latestOne = captureState.image;
  const imageP = captureWebContents(activeTab.view.webContents).then(
    (image) => {
      captureState.image = image ? resizeImage(image, 0.1) : null;

      return image;
    }
  );

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
    mainTabbedWin.tabs.checkLoadingView();
    getLatestCapturedActiveTab();
  }
);

handleIpcMainInvoke('toggle-activetab-animating', async (_, animating) => {
  const mainWin = await onMainWindowReady();

  const activeTab = mainWin.tabs.selected;
  if (!activeTab) return;

  activeTab.toggleAnimating(animating);
  const isLoading = !!activeTab.view?.webContents.isLoading();

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
