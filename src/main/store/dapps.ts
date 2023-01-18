/// <reference path="../../isomorphic/types.d.ts" />

import { app } from 'electron';
import Store from 'electron-store';
import {
  fillUnpinnedList,
  formatDapp,
  normalizeProtocolBindingValues,
} from '@/isomorphic/dapp';
import { arraify } from '@/isomorphic/array';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
} from '../utils/ipcMainEvents';
import { APP_NAME, PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import { canoicalizeDappUrl, isDappProtocol } from '../../isomorphic/url';
import { detectDapp } from '../utils/dapps';
import { getBindLog } from '../utils/log';
import { getAppProxyConf } from './desktopApp';

const storeLog = getBindLog('store', 'bgGreen');

const IDappSchema: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    alias: { type: 'string' },
    // stricted canonical url, only includes protocols, host(maybe with port), pathname
    origin: { type: 'string' },
    faviconUrl: { type: 'string' },
    faviconBase64: { type: 'string' },
  },
};

export const dappStore = new Store<{
  dapps: IDapp[];
  protocolDappsBinding: Record<string, IDapp['origin'][]>;
  dappsMap: Record<IDapp['origin'], IDapp>;
  pinnedList: string[];
  unpinnedList: string[];
}>({
  name: `${PERSIS_STORE_PREFIX}dapps`,

  cwd: app.getPath('userData').replace('Electron', APP_NAME),

  schema: {
    /** @deprecated */
    dapps: {
      type: 'array',
      items: IDappSchema,
      default: [] as IDapp[],
    },
    protocolDappsBinding: {
      type: 'object',
      patternProperties: {
        '^https?://.+$': {
          type: ['array', 'string'],
          items: {
            type: 'string',
          },
        },
      },
      default: {} as Record<IDapp['origin'], IDapp['origin'][]>,
    },
    dappsMap: {
      type: 'object',
      patternProperties: {
        '^https://.+$': IDappSchema,
      },
      additionalProperties: false,
      default: {} as Record<IDapp['origin'], IDapp>,
    },
    pinnedList: {
      type: 'array',
      items: {
        type: 'string',
      },
      default: [] as string[],
      uniqueItems: true,
    },
    unpinnedList: {
      type: 'array',
      items: {
        type: 'string',
      },
      default: [] as string[],
      uniqueItems: true,
    },
  },

  // TODO: if want to obfuscat, uncomment it
  // encryptionKey: 'rabby-desktop'

  serialize: shortStringify,

  deserialize: (data) => safeParse(data, {}),

  watch: true,

  beforeEachMigration: (store, context) => {
    storeLog(
      `[dapps] migrate from ${context.fromVersion} -> ${context.toVersion}`
    );
  },
  migrations: {
    '>=0.3.0': (store) => {
      const dapps = store.get('dapps') || [];

      let dappsMap = store.get('dappsMap');
      if ((!dappsMap || !Object.keys(dappsMap).length) && dapps.length) {
        dappsMap = dapps.reduce((acc, dapp) => {
          acc[dapp.origin] = dapp;
          return acc;
        }, {} as Record<IDapp['origin'], IDapp>);
        store.set('dappsMap', dappsMap);
      }
    },
  },
});

(function initStore() {
  const dappsMap = dappStore.get('dappsMap') || {};

  const { pinnedList, unpinnedList } = fillUnpinnedList(
    dappsMap,
    dappStore.get('pinnedList'),
    dappStore.get('unpinnedList')
  );

  dappStore.set('pinnedList', pinnedList);
  dappStore.set('unpinnedList', unpinnedList);
})();

export function getAllDapps() {
  const dappsMap = dappStore.get('dappsMap') || {};

  const result = Object.values(dappsMap).map((dapp) => formatDapp(dapp)!);

  // if (opts?.sort) {
  //   result = result.sort((a, b) => {
  //     const aPinned = dappStore.get('pinnedList', []).includes(a.origin);
  //     const bPinned = dappStore.get('pinnedList', []).includes(b.origin);
  //     if (aPinned && !bPinned) {
  //       return -1;
  //     }
  //     if (!aPinned && bPinned) {
  //       return 1;
  //     }
  //     return 0;
  //   });
  // }

  return result;
}

export function findDappByOrigin(url: string, dapps = getAllDapps()) {
  const dappOrigin = canoicalizeDappUrl(url).origin;
  return dapps.find((item) => item.origin === dappOrigin) || null;
}

export function parseDappUrl(url: string, dapps = getAllDapps()) {
  const { isDapp, origin } = canoicalizeDappUrl(url);

  const foundDapp = !isDapp
    ? null
    : dapps.find((item: IDapp) => {
        const formatted = formatDapp(item);
        return formatted?.origin && formatted.origin === origin;
      });
  const existedOrigin = !isDapp ? false : !!foundDapp;

  return {
    isDapp,
    origin,
    existedOrigin,
    foundDapp,
  };
}

// const allDapps = getAllDapps();
// detectDapp('https://debank.com', allDapps);

handleIpcMainInvoke('detect-dapp', async (_, dappUrl) => {
  const allDapps = getAllDapps();
  const proxyConf = getAppProxyConf();

  const result = await detectDapp(dappUrl, {
    existedDapps: allDapps,
    proxyOnParseFavicon:
      proxyConf.proxyType === 'custom'
        ? {
            protocol: proxyConf.proxySettings.protocol,
            host: proxyConf.proxySettings.hostname,
            port: proxyConf.proxySettings.port,
          }
        : undefined,
  });

  return {
    result,
  };
});

handleIpcMainInvoke('get-dapp', (_, dappOrigin) => {
  // TODO: if not found, return error
  const dapp = dappStore.get('dappsMap')[dappOrigin];
  const isPinned = !!dappStore.get('pinnedList').find((d) => d === dappOrigin);

  return {
    dapp,
    isPinned,
  };
});

handleIpcMainInvoke('dapps-fetch', () => {
  const dapps = getAllDapps();
  const pinnedList = dappStore.get('pinnedList');
  const unpinnedList = dappStore.get('unpinnedList');

  return {
    dapps,
    pinnedList,
    unpinnedList,
  };
});

handleIpcMainInvoke('dapps-put', (_, dapp: IDapp) => {
  // TODO: is there mutex?
  const dappsMap = dappStore.get('dappsMap');

  dappsMap[dapp.origin] = {
    ...dappsMap[dapp.origin],
    ...dapp,
  };
  dappStore.set('dappsMap', dappsMap);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    dapps: getAllDapps(),
  });
});

handleIpcMainInvoke('dapps-delete', (_, dappToDel: IDapp) => {
  const dappsMap = dappStore.get('dappsMap');
  const dapp = [dappToDel.origin];

  if (!dapp) {
    return {
      error: 'Not found',
      dapps: [],
    };
  }

  delete dappsMap[dappToDel.origin];

  dappStore.set('dappsMap', dappsMap);

  const pinnedList = dappStore
    .get('pinnedList')
    .filter((o) => o !== dappToDel.origin);
  dappStore.set('pinnedList', pinnedList);
  const unpinnedList = dappStore
    .get('unpinnedList')
    .filter((o) => o !== dappToDel.origin);
  dappStore.set('unpinnedList', unpinnedList);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    dapps: getAllDapps(),
    pinnedList,
    unpinnedList,
  });

  return {
    dapps: getAllDapps(),
  };
});

handleIpcMainInvoke('dapps-togglepin', async (_, dappOrigins, nextPinned) => {
  const pinnedList = dappStore.get('pinnedList') || [];
  const unpinnedList = dappStore.get('unpinnedList') || [];

  dappOrigins.forEach((origin) => {
    const pinnedIdx = pinnedList.findIndex((o) => o === origin);
    if (pinnedIdx > -1) {
      pinnedList.splice(pinnedIdx, 1);
    }
    const unpinnedIdx = unpinnedList.findIndex((o) => o === origin);
    if (unpinnedIdx > -1) {
      unpinnedList.splice(unpinnedIdx, 1);
    }
    if (nextPinned) {
      pinnedList.unshift(origin);
    } else {
      unpinnedList.push(origin);
    }
  });

  dappStore.set('pinnedList', pinnedList);
  dappStore.set('unpinnedList', unpinnedList);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    pinnedList,
    unpinnedList,
  });

  return {};
});

handleIpcMainInvoke('dapps-setOrder', (_, { pinnedList, unpinnedList }) => {
  const dappsMap = dappStore.get('dappsMap');

  let changed = false;

  // TODO: validate
  if (Array.isArray(pinnedList)) {
    pinnedList = pinnedList.filter(
      (dappOrigin) => !!dappOrigin && dappsMap[dappOrigin]
    );
    const currentPinnedList = dappStore.get('pinnedList');

    if (pinnedList.length !== currentPinnedList.length) {
      return {
        error: 'Invalid Params',
      };
    }
    if (pinnedList.some((dappOrigin) => !dappsMap[dappOrigin])) {
      return {
        error: 'Invalid Params',
      };
    }
    dappStore.set('pinnedList', pinnedList);
    changed = true;
  }

  // TODO: validate
  if (Array.isArray(unpinnedList)) {
    unpinnedList = unpinnedList.filter(
      (dappOrigin) => !!dappOrigin && dappsMap[dappOrigin]
    );
    const currentUnpinnedList = dappStore.get('unpinnedList');

    if (unpinnedList.length !== currentUnpinnedList.length) {
      return {
        error: 'Invalid Params',
      };
    }
    if (unpinnedList.some((dappOrigin) => !dappsMap[dappOrigin])) {
      return {
        error: 'Invalid Params',
      };
    }
    dappStore.set('unpinnedList', unpinnedList);
    changed = true;
  }

  if (changed) {
    emitIpcMainEvent('__internal_main:dapps:changed', {
      pinnedList: dappStore.get('pinnedList'),
      unpinnedList: dappStore.get('unpinnedList'),
    });
  }

  return {
    error: null,
  };
});

handleIpcMainInvoke('dapps-fetch-protocol-binding', () => {
  const protocolBindings = dappStore.get('protocolDappsBinding') || {};

  return {
    result: normalizeProtocolBindingValues(protocolBindings),
  };
});

handleIpcMainInvoke('dapps-put-protocol-binding', (_, pBindings) => {
  const protocolBindings = dappStore.get('protocolDappsBinding') || {};
  const dappOrigins = new Set(
    getAllDapps()
      .map((d) => d.origin)
      .filter(Boolean)
  );

  let errItem: { error: string } | null = null;

  Object.keys(pBindings).some((pLink) => {
    // if (!isDappProtocol(pLink)) {
    //   errItem = {
    //     error: 'Invalid protocol link',
    //   };
    //   return true;
    // }

    return arraify(pBindings[pLink]).some((dappOrigin: string) => {
      if (!dappOrigins.has(dappOrigin)) {
        errItem = {
          error: `Invalid dapp origin for protocol binding ${dappOrigin}`,
        };
        return true;
      }
      return false;
    });
  });

  if (errItem) return errItem;

  Object.assign(protocolBindings, pBindings);
  dappStore.set('protocolDappsBinding', protocolBindings);

  return {};
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

    const dappsMap = dappStore.get('dappsMap');

    if (opType === 'add') {
      dappToAdd.forEach((dapp) => {
        dappsMap[dapp.origin] = dapp;
      });
    } else if (opType === 'trim') {
      dappToAdd.forEach((dapp) => {
        delete dappsMap[dapp.origin];
      });
    }

    dappStore.set('dappsMap', dappsMap);
    event.sender.reload();
  }
);
