import { PERSIS_STORE_PREFIX } from '@/isomorphic/constants';

import { makeStore } from '../utils/store';
import { onIpcMainInternalEvent } from '../utils/ipcMainEvents';

const IDetectedDappVersionSchema: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    versionSha512: {
      type: 'string',
    },
    timestamp: {
      type: 'number',
    },
  },
};

export const cacheStore = makeStore<{
  dappIdToAbsPathMap: Record<string, string>;
  dappVersionMap: Record<
    string,
    {
      latestConfirmedVersion?: IHttpTypeDappVersion | null;
      versionQueue: IHttpTypeDappVersion[];
    }
  >;
}>({
  name: `${PERSIS_STORE_PREFIX}cache`,

  schema: {
    dappIdToAbsPathMap: {
      type: 'object',
      patternProperties: {
        '^.+$': {
          type: 'string',
          default: '',
        },
      },
      default: {},
    },
    dappVersionMap: {
      type: 'object',
      patternProperties: {
        // only http type dapp supported
        '^(https?)://.+$': {
          type: 'object',
          properties: {
            latestConfirmedVersion: IDetectedDappVersionSchema,
            versionQueue: {
              type: 'array',
              items: IDetectedDappVersionSchema,
            },
          },
        },
      },
    },
  },

  watch: true,
});

const LEN_DAPP_VERSIO_QUEUE = 5;
/**
 * @description insert dappVersionItem into dappVersionMap[dappId].versionQueue, and
 * NEVER update existed latestConfirmedVersion, but would fill it if it's null.
 *
 * you should ONLY confirm latestConfirmedVersion by calling `confirmDappVersion`
 */
export function putDappVersions(
  dappId: string,
  dappVersionItem: IHttpTypeDappVersion
) {
  const dappVersionMap = cacheStore.get('dappVersionMap', {});

  dappVersionItem = {
    versionSha512: dappVersionItem.versionSha512,
    timestamp: dappVersionItem.timestamp,
  };

  const { versionQueue = [] } = dappVersionMap[dappId] || {};
  let { latestConfirmedVersion = null } = dappVersionMap[dappId] || {};

  if (versionQueue.length >= LEN_DAPP_VERSIO_QUEUE) {
    versionQueue.splice(4);
  }

  versionQueue.unshift(dappVersionItem);
  latestConfirmedVersion = latestConfirmedVersion || { ...dappVersionItem };

  dappVersionMap[dappId] = {
    latestConfirmedVersion,
    versionQueue,
  };
  cacheStore.set('dappVersionMap', dappVersionMap);

  return dappVersionMap[dappId];
}

export function getDappVersions(dappId: string) {
  const dappVersionMap = cacheStore.get('dappVersionMap', {});

  const { versionQueue = [] } = dappVersionMap[dappId] || {};
  const { latestConfirmedVersion = null } = dappVersionMap[dappId] || {};

  return {
    latestConfirmedVersion,
    versionQueue,
  };
}

export function confirmDappVersion(dappId: string) {
  const dappVersionMap = cacheStore.get('dappVersionMap', {});

  const dappVersion = getDappVersions(dappId);

  dappVersion.latestConfirmedVersion = {
    ...dappVersion.versionQueue[0],
  };

  dappVersionMap[dappId] = dappVersion;

  cacheStore.set('dappVersionMap', dappVersionMap);
}

onIpcMainInternalEvent(
  '__internal_main:app:cache-dapp-id-to-abspath',
  (maps, opts) => {
    let dappIdToAbsPathMap = cacheStore.get('dappIdToAbsPathMap');

    if (opts?.cleanOld) {
      dappIdToAbsPathMap = {};
    }

    cacheStore.set('dappIdToAbsPathMap', {
      ...dappIdToAbsPathMap,
      ...maps,
    });
  }
);

(function initStore() {
  // clear dappVersionMap every time bootstrap
  cacheStore.set('dappVersionMap', {});
})();
