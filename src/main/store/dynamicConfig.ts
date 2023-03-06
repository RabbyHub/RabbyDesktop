/// <reference path="../../isomorphic/types.d.ts" />

import {
  IS_RUNTIME_PRODUCTION,
  PERSIS_STORE_PREFIX,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { makeStore } from '../utils/store';
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

export const dynamicConfigStore = makeStore<IAppDynamicConfig>({
  name: `${PERSIS_STORE_PREFIX}dynamicConfig`,

  schema: {
    domain_metas: {
      type: 'object',
      patternProperties: {
        '^.+$': SchemaDomainMetas,
      },
      default: {},
    },
    special_main_domains: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      default: {},
    },
  },

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,

  encryptionKey: 'dynamicConfig',
});

const INTERVAL_SEC = IS_RUNTIME_PRODUCTION ? 5 * 60 : 60;
function scheduleFetch() {
  const fetchData = () => {
    fetchDynamicConfig({ proxy: getAppProxyConfigForAxios() }).then(
      ({ domain_metas, special_main_domains }) => {
        cLog('[scheduleFetch] DynamicConfig will be updated');
        // leave here for debug
        if (!IS_RUNTIME_PRODUCTION) {
          // console.debug('[scheduleFetch] domain_metas', domain_metas)
        }

        dynamicConfigStore.set('domain_metas', {
          ...dynamicConfigStore.get('domain_metas'),
          ...domain_metas, // shallow merge to avoid bad data from remote
        });
        dynamicConfigStore.set('special_main_domains', {
          ...dynamicConfigStore.get('special_main_domains'),
          ...special_main_domains,
        });
      }
    );
  };
  fetchData();
  setInterval(fetchData, INTERVAL_SEC * 1e3);
}

scheduleFetch();

handleIpcMainInvoke('get-app-dynamic-config', () => {
  return {
    dynamicConfig: {
      domain_metas: dynamicConfigStore.get('domain_metas'),
      special_main_domains: dynamicConfigStore.get('special_main_domains'),
    },
  };
});
