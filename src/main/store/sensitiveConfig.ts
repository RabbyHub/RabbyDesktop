/// <reference path="../../isomorphic/types.d.ts" />
import { app } from 'electron';
import Store from 'electron-store';

import { APP_NAME, PERSIS_STORE_PREFIX } from '@/isomorphic/constants';
import { safeParse, shortStringify } from '@/isomorphic/json';

export const sensitiveConfigStore = new Store<{
  enableContentProtected: ISensitiveConfig['enableContentProtected'];
  proxySettings: ISensitiveConfig['enableContentProtected'];
}>({
  name: `${PERSIS_STORE_PREFIX}sensitiveConfig`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

  schema: {
    enableContentProtected: {
      type: 'boolean',
      default: true,
    },
    proxySettings: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['socks5', 'http'],
        },
        hostname: {
          type: 'string',
        },
        port: {
          type: 'number',
        },
      },
      default: {
        type: 'socks5',
        hostname: '',
        port: 0,
      },
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,
});
