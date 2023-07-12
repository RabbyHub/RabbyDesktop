import { MessageBoxOptions, dialog } from 'electron';
import { emitIpcMainEvent } from './ipcMainEvents';
import { onMainWindowReady } from './stream-helpers';

export function notifyShowFindInPage(
  tabOrigin: { x: number; y: number },
  tabId: number
) {
  // notify search window to show
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: true,
    pageInfo: {
      type: 'in-dapp-find',
      searchInfo: {
        tabId,
        tabOrigin,
      },
    },
  });
}

export function notifyHideFindInPage() {
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    type: 'in-dapp-find',
    nextShow: false,
  });
}

export function notifyHidePopupWindowOnMain(type: IPopupWinPageInfo['type']) {
  emitIpcMainEvent('__internal_main:popupwin-on-mainwin:toggle-show', {
    type,
    nextShow: false,
  });
}

export async function alertRestartApp(options?: {
  cancelText?: string;
  confirmText?: string;
  msgBoxOptions?: Partial<Pick<MessageBoxOptions, 'title' | 'message'>>;
  forceRestart?: boolean;
}) {
  const {
    cancelText = 'Cancel',
    confirmText = 'Restart',
    forceRestart,
  } = options || {};

  const dialogButtons = forceRestart
    ? [confirmText]
    : [cancelText, confirmText];
  const cancelId = dialogButtons.indexOf(cancelText);
  const confirmId = dialogButtons.indexOf(confirmText);

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    title: 'Restart Rabby',
    message:
      'Something about Rabby has changed. Restarting Rabby will apply the changes.',
    ...options?.msgBoxOptions,
    type: 'question',
    ...(cancelId === -1
      ? {
          defaultId: confirmId,
          cancelId: undefined,
        }
      : {
          defaultId: cancelId,
          cancelId,
        }),
    noLink: true,
    buttons: dialogButtons,
  });

  if (result.response === confirmId) {
    emitIpcMainEvent('__internal_main:app:relaunch');
  }
}
