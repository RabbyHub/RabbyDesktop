/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { onIpcMainEvent } from '../utils/ipcMainEvents';

export const desktopAppStore = new Store<{
  firstStartApp: boolean;
}>({
  name: `${PERSIS_STORE_PREFIX}desktopApp`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

  schema: {
    firstStartApp: {
      type: 'boolean',
      default: true
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,
});

onIpcMainEvent('get-desktopAppState', (event, reqid: string) => {
  desktopAppStore.set('firstStartApp', false);

  event.reply('get-desktopAppState', {
    reqid,
    state: {
      firstStartApp: desktopAppStore.get('firstStartApp')
    },
  });
})

onIpcMainEvent('put-desktopAppState-hasStarted', (event, reqid: string) => {
  desktopAppStore.set('firstStartApp', false);

  event.reply('put-desktopAppState-hasStarted', {
    reqid,
  });
})
