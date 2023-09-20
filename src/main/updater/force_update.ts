import { arraify } from '@/isomorphic/array';
import { app, dialog } from 'electron';
import { dynamicConfigStore } from '../store/dynamicConfig';
import { onMainWindowReady } from '../utils/stream-helpers';
import { safeOpenExternalURL } from '../utils/security';

const ResetDialogButtons = ['OK', 'Go to Download'] as const;

async function alertForceUpdate() {
  const cancleId = ResetDialogButtons.findIndex((x) => x === 'OK');
  const confirmId = ResetDialogButtons.findIndex((x) => x === 'Go to Download');

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'info',
    title: 'Force Update',
    message:
      'This version has been deprecated! Please download the latest version.',
    defaultId: confirmId,
    cancelId: cancleId,
    noLink: true,
    buttons: ResetDialogButtons as any as string[],
  });

  if (result.response === confirmId) {
    safeOpenExternalURL('https://rabby.io/?platform=desktop');
  }

  app.quit();
}

/**
 * @description check if force update is needed,
 * make sure call this function after app ready
 */
export async function checkForceUpdate() {
  await app.whenReady();
  const appVersion = app.getVersion();
  const app_update = dynamicConfigStore.get('app_update');
  const force_update = arraify(app_update?.force_update || []).filter(Boolean);

  console.debug(
    '[checkForceUpdate] appVersion: %s, force_update: %s',
    appVersion,
    force_update
  );

  if (force_update.includes(appVersion)) {
    await alertForceUpdate();
  }
}
