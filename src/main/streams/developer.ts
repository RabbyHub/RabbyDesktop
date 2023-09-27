import { dialog } from 'electron';
import {
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
} from '../utils/ipcMainEvents';
import { getBindLog } from '../utils/log';
import { onMainWindowReady } from '../utils/stream-helpers';
import { rabbyxQuery } from './rabbyIpcQuery/_base';
import {
  clearAppUpdaterCache,
  getAppUpdaterCacheDir,
} from '../updater/updater';

const developerLog = getBindLog('developer', 'bgGrey');
const ResetDialogButtons = ['Cancel', 'Confirm'] as const;
onIpcMainEvent('__internal_rpc:app:reset-rabbyx-approvals', async () => {
  const cancleId = ResetDialogButtons.findIndex((x) => x === 'Cancel');
  const confirmId = ResetDialogButtons.findIndex((x) => x === 'Confirm');

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'question',
    title: 'Reset Rabby Signs',
    message: 'All incompleted Sign would be clear. Do you confirm?',
    defaultId: cancleId,
    cancelId: cancleId,
    noLink: true,
    buttons: ResetDialogButtons as any as string[],
  });

  developerLog('reset rabbyx signs response:', result.response);
  if (result.response === confirmId) {
    rabbyxQuery('walletController.rejectAllApprovals');
    await dialog.showMessageBox(mainWin.window, {
      title: 'Reset Rabby Signs',
      type: 'info',
      message: 'All incompleted Signs has been rejected.',
    });
  }
});

handleIpcMainInvoke(
  '__internal_invoke:app:debug-kits-actions',
  async (_, payload) => {
    switch (payload.action) {
      case 'clean-updates-download-cache': {
        clearAppUpdaterCache();
        break;
      }
      default: {
        break;
      }
    }
  }
);
