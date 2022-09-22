/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { detectDapps } from '../utils/dapps';

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

export function isExistedOrigin(url: string) {
  const { isDapp, origin } = canoicalizeDappUrl(url);
  if (!isDapp) return false;

  const existedOrigin = dappStore.get('dapps').some((item: IDapp) => {
    const formatted = formatDapp(item);
    return formatted?.origin && formatted.origin === origin;
  });

  return {
    isDapp,
    existedOrigin,
  }
}

onIpcMainEvent('detect-dapp', async (event, reqid, dappUrl) => {
  const result = await detectDapps(dappUrl);

  event.reply('detect-dapp', {
    reqid,
    result,
  });
})

onIpcMainEvent('dapps-fetch', (event, reqid) => {
  event.reply('dapps-fetch', {
    reqid,
    dapps: formatDapps(dappStore.get('dapps')),
  });
})

onIpcMainEvent('dapps-put', (event, reqid: string, dapp: IDapp) => {
  // TODO: is there mutex?
  const allDapps = formatDapps(dappStore.get('dapps'));
  const existedDapp = allDapps.find((d) => d.origin === dapp.origin);
  if (existedDapp) {
    Object.assign(existedDapp, dapp);
  } else {
    allDapps.push(dapp);
  }

  dappStore.set('dapps', allDapps);

  event.reply('dapps-put', {
    reqid,
    dapps: allDapps,
  });
});

onIpcMainEvent('dapps-delete', (event, reqid: string, dapp: IDapp) => {
  const allDapps = dappStore.get('dapps') || [];
  const idx = allDapps.findIndex((d) => {
    return d.origin === dapp.origin;
  });

  let error: string = '';
  if (idx > -1) {
    allDapps.splice(idx, 1);
    dappStore.set('dapps', allDapps);
  } else {
    error = 'Not found';
  }

  event.reply('dapps-delete', {
    reqid,
    dapps: allDapps,
    error,
  });
});
