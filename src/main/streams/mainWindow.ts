import { dialog } from 'electron';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import {
  onMainWindowReady,
  updateMainWindowActiveTabRect,
} from '../utils/stream-helpers';
import { fromMainSubject } from './_init';

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

onIpcMainEvent('__internal_rpc:mainwindow:reload-tab', async (_, tabId) => {
  const mainTabbedWin = await onMainWindowReady();

  const tab = mainTabbedWin.tabs.get(tabId);
  if (!tab) return;

  tab.reload();
});

handleIpcMainInvoke('toggle-activetab-animating', async (_, animating) => {
  const mainWin = await onMainWindowReady();

  const activeTab = mainWin.tabs.selected;
  if (!activeTab) return;

  activeTab.toggleAnimating(animating);
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
      if (activeTab) activeTab.setAnimatedMainWindowTabRect(reports.rect);
    } else if (reports.dappViewState === 'unmounted') {
      updateMainWindowActiveTabRect({
        dappViewState: 'unmounted',
      });
      mainTabbedWin.tabs.unSelectAll();
      if (activeTab)
        emitIpcMainEvent('__internal_main:mainwindow:toggle-loading-view', {
          type: 'hide',
          tabId: activeTab.id,
        });
    }
  }
);
