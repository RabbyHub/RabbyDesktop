import { firstValueFrom } from 'rxjs';
import { fromMainSubject } from './_init';

import { cLog } from '../utils/log';

export async function getWebuiExtId () {
  const ext = (await firstValueFrom(fromMainSubject('webuiExtension')));

  cLog('getWebuiExtId', ext.id);

  return ext.id;
};
