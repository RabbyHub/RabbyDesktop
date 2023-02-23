/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  PERSIS_STORE_PREFIX,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { fetchDynamicConfig } from '../utils/fetch';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { cLog } from '../utils/log';
import { getAppProxyConfigForAxios } from './desktopApp';

const SchemaDomainMetas: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    alias: { type: 'string' },
    navColorLight: { type: 'string' },
    navColorColor: { type: 'string' },
    faviconURL: { type: 'string' },
  },
};

export const dynamicConfigStore = new Store<IAppDynamicConfig>({
  name: `${PERSIS_STORE_PREFIX}dynamicConfig`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

  schema: {
    domain_metas: {
      type: 'object',
      patternProperties: {
        '^.+$': SchemaDomainMetas,
      },
      default: {},
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,

  encryptionKey: 'dynamicConfig',
});

const INTERVAL_SEC = IS_RUNTIME_PRODUCTION ? 5 * 60 : 5;
function scheduleFetch() {
  setInterval(() => {
    fetchDynamicConfig({ proxy: getAppProxyConfigForAxios() }).then(
      ({ domain_metas }) => {
        cLog('[scheduleFetch] DynamicConfig will be updated');
        // leave here for debug
        if (!IS_RUNTIME_PRODUCTION) {
          // console.debug('[scheduleFetch] domain_metas', domain_metas)
        }

        dynamicConfigStore.set('domain_metas', {
          ...dynamicConfigStore.get('domain_metas'),
          ...domain_metas, // shallow merge to avoid bad data from remote
        });
      }
    );
  }, INTERVAL_SEC * 1e3);
}

scheduleFetch();

handleIpcMainInvoke('get-app-dynamic-config', () => {
  return {
    dynamicConfig: {
      domain_metas: dynamicConfigStore.get('domain_metas'),
    },
  };
});
