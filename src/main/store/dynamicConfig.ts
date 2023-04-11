/// <reference path="../../isomorphic/types.d.ts" />

import { arraify } from '@/isomorphic/array';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import {
  IS_RUNTIME_PRODUCTION,
  PERSIS_STORE_PREFIX,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { makeStore } from '../utils/store';
import {
  DEFAULT_BLOCKCHAIN_EXPLORERS,
  fetchDynamicConfig,
} from '../utils/fetch';
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
    blockchain_explorers: {
      type: 'array',
      items: { type: 'string' },
      default: [],
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
    app_update: {
      type: 'object',
      properties: {
        force_update: {
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
      ({
        domain_metas,
        blockchain_explorers,
        special_main_domains,
        app_update,
      }) => {
        cLog('[scheduleFetch] DynamicConfig will be updated');
        // leave here for debug
        if (!IS_RUNTIME_PRODUCTION) {
          // console.debug('[scheduleFetch] domain_metas', domain_metas)
        }

        dynamicConfigStore.set('domain_metas', {
          ...dynamicConfigStore.get('domain_metas'),
          ...domain_metas, // shallow merge to avoid bad data from remote
        });
        dynamicConfigStore.set('blockchain_explorers', [
          ...new Set(blockchain_explorers),
        ]);
        dynamicConfigStore.set('special_main_domains', {
          ...dynamicConfigStore.get('special_main_domains'),
          ...special_main_domains,
        });
        dynamicConfigStore.set('app_update', {
          ...dynamicConfigStore.get('app_update'),
          ...app_update,
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

export function getBlockchainExplorers() {
  const set = new Set(DEFAULT_BLOCKCHAIN_EXPLORERS);

  arraify(dynamicConfigStore.get('blockchain_explorers')).forEach((d) => {
    if (d) set.add(d);
  });

  return set;
}

export function isTargetScanLink(targetURL: string | ICanonalizedUrlInfo) {
  const parsedInfo =
    typeof targetURL === 'string' ? canoicalizeDappUrl(targetURL) : targetURL;
  const recordSet = getBlockchainExplorers();

  return (
    recordSet.has(parsedInfo.hostname) ||
    recordSet.has(parsedInfo.secondaryDomain)
  );
}
