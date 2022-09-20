/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';

export const dappStore = new Store<{
  dapps: IDapp[];
}>({
  name: `${PERSIS_STORE_PREFIX}dapps`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

  schema: {
    dapps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          alias: { type: 'string' },
          // url: { type: 'string' },
          // stricted canonical url, only includes protocols, host(maybe with port), pathname
          origin: { type: 'string' },
          faviconUrl: { type: 'string' },
          faviconBase64: { type: 'string' }
        },
      },
      default: [] as IDapp[],
    },
    // dappsConnectioned: {
    //   type: 'object',
    //   properties: {}
    // }
  },

  // TODO: if want to obfuscat, uncomment it
  // encryptionKey: 'rabby-desktop'

  // TODO: if you want to customize the searializer, uncomment it
  // serialize: (data) => JSON.stringify(value, null, '\t')
  // deserialize: JSON.parse

  watch: true,
});
