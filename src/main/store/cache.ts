import { PERSIS_STORE_PREFIX } from '@/isomorphic/constants';

import { makeStore } from '../utils/store';
import { onIpcMainInternalEvent } from '../utils/ipcMainEvents';

export const cacheStore = makeStore<{
  dappIdToAbsPathMap: Record<string, string>;
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
  },

  watch: true,
});

onIpcMainInternalEvent(
  '__internal_main:app:cache-dapp-id-to-abspath',
  (dappId, absPath) => {
    const dappIdToAbsPathMap = cacheStore.get('dappIdToAbsPathMap');

    cacheStore.set('dappIdToAbsPathMap', {
      ...dappIdToAbsPathMap,
      [dappId]: absPath,
    });
  }
);
