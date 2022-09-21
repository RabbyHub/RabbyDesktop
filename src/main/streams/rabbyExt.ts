import { firstValueFrom } from 'rxjs';
import { fromMainSubject } from './_init';

import { cLog } from '../utils/log';

export async function getRabbyExtId () {
  const ext = (await firstValueFrom(fromMainSubject('rabbyExtension')));

  cLog('getRabbyExtId', ext.id);

  return ext.id;
};
