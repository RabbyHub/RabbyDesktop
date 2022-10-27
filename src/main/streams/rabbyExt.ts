import { firstValueFrom } from 'rxjs';
import { app } from 'electron';
import { fromMainSubject } from './_init';

import { cLog } from '../utils/log';
import { onIpcMainEvent } from '../utils/ipcMainEvents';

export async function getRabbyExtId() {
  const ext = await firstValueFrom(fromMainSubject('rabbyExtension'));

  cLog('getRabbyExtId', ext.id);

  return ext.id;
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
