/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';

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

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,
});

export function formatDapp (input: any) {
  if (!input?.origin) return null

  return {
    alias: input?.alias || '',
    origin: input.origin,
    faviconUrl: input?.faviconUrl || '',
    faviconBase64: input?.faviconBase64 || '',
  };
}

export function formatDapps(input = dappStore.get('dapps')): IDapp[] {
  if (!Array.isArray(input)) return [];

  const result: IDapp[] = [];

  input.forEach(item => {
    const f = formatDapp(item);
    if (!f) return ;
    result.push(f);
  });

  return result;
}
