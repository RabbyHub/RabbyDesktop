/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import { arraify } from '@/isomorphic/array';
import { canoicalizeDappUrl } from '@/isomorphic/url';
import { checkNeedAlertUpgrade } from '@/isomorphic/app-config';
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
import { getOptionProxyForAxios } from './desktopApp';
import { pushEventToMainWindowContents } from '../utils/tabbedBrowserWindow';

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
        /**
         * @description match with semver rules
         */
        alert_upgrade_to_latest: {
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
async function doFetchDynamicConfig() {
  cLog('[doFetchDynamicConfig] start fetch DynamicConfig...');
  return fetchDynamicConfig({ proxy: getOptionProxyForAxios() }).then(
    ({
      domain_metas,
      blockchain_explorers,
      special_main_domains,
      app_update,
    }) => {
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

      return {
        domain_metas: dynamicConfigStore.get('domain_metas'),
        blockchain_explorers: dynamicConfigStore.get('blockchain_explorers'),
        special_main_domains: dynamicConfigStore.get('special_main_domains'),
        app_update: dynamicConfigStore.get('app_update'),
      };
    }
  );
}

// scheduleFetch
// eslint-disable-next-line no-lone-blocks
{
  doFetchDynamicConfig();
  setInterval(async () => {
    await doFetchDynamicConfig();
    cLog('[scheduleFetch] DynamicConfig will be updated');
  }, INTERVAL_SEC * 1e3);
}

handleIpcMainInvoke('get-app-dynamic-config', () => {
  return {
    dynamicConfig: {
      domain_metas: dynamicConfigStore.get('domain_metas'),
      special_main_domains: dynamicConfigStore.get('special_main_domains'),
    },
  };
});

handleIpcMainInvoke('check-need-alert-upgrade', async () => {
  const { app_update } = await doFetchDynamicConfig();

  return {
    needAlertUpgrade: checkNeedAlertUpgrade(
      app.getVersion(),
      app_update?.alert_upgrade_to_latest || []
    ).needAlertUpgrade,
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
