/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';

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

  watch: true,
});
