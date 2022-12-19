/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import { formatDapp, formatDapps } from '@/isomorphic/dapp';
import { onIpcMainEvent } from '../utils/ipcMainEvents';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { canoicalizeDappUrl } from '../../isomorphic/url';
import { detectDapps } from '../utils/dapps';

export const dappStore = new Store<{
  dapps: IDapp[];
  pinnedList: string[];
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
          faviconBase64: { type: 'string' },
        },
      },
      default: [] as IDapp[],
    },
    pinnedList: {
      type: 'array',
      items: {
        type: 'string',
      },
      default: [] as string[],
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

export function parseDappUrl(
  url: string,
  existedDapps = formatDapps(dappStore.get('dapps'))
) {
  const { isDapp, origin } = canoicalizeDappUrl(url);

  const existedOrigin = !isDapp
    ? false
    : existedDapps.some((item: IDapp) => {
        const formatted = formatDapp(item);
        return formatted?.origin && formatted.origin === origin;
      });

  return {
    isDapp,
    origin,
    existedOrigin,
  };
}

onIpcMainEvent('detect-dapp', async (event, reqid, dappUrl) => {
  const allDapps = formatDapps(dappStore.get('dapps'));
  const result = await detectDapps(dappUrl, allDapps);

  event.reply('detect-dapp', {
    reqid,
    result,
  });
});

onIpcMainEvent('dapps-fetch', (event, reqid) => {
  const dapps = formatDapps(dappStore.get('dapps'));
  const pinnedList = dappStore.get('pinnedList');

  event.reply('dapps-fetch', {
    reqid,
    dapps,
    pinnedList,
  });
});

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

  let error = '';
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

onIpcMainEvent('dapps-togglepin', (event, reqid, dappOrigins, nextPinned) => {
  // const dapps = dappStore.get('dapps') || [];
  const pinnedList = dappStore.get('pinnedList') || [];

  dappOrigins.forEach((origin) => {
    const idx = pinnedList.findIndex((o) => o === origin);
    if (idx > -1) {
      pinnedList.splice(idx, 1);
    }
    if (nextPinned) {
      pinnedList.unshift(origin);
    }
  });

  dappStore.set('pinnedList', pinnedList);

  event.reply('dapps-togglepin', {
    reqid,
    pinnedList,
  });
});

onIpcMainEvent(
  '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
  (event, opType) => {
    const dappToAdd: IDapp[] = [
      {
        alias: 'badssl',
        origin: 'https://expired.badssl.com',
        faviconUrl: '',
        faviconBase64: '',
      },
      {
        alias: 'self-signed',
        origin: 'https://self-signed.badssl.com',
        faviconUrl: '',
        faviconBase64: '',
      },
    ];

    let allDapps = formatDapps(dappStore.get('dapps'));

    if (opType === 'add') {
      dappToAdd.forEach((dapp) => {
        if (allDapps.some((d) => d.origin === dapp.origin)) return;

        allDapps.push(dapp);
      });
    } else if (opType === 'trim') {
      allDapps = allDapps.filter((dapp) => {
        if (dapp.origin.indexOf('badssl.com') > -1) return false;
        return true;
      });
    }

    dappStore.set('dapps', allDapps);
    event.sender.reload();
  }
);
