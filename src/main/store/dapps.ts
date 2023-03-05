/// <reference path="../../isomorphic/types.d.ts" />

import {
  fillUnpinnedList,
  formatDapp,
  formatDapps,
  normalizeProtocolBindingValues,
} from '@/isomorphic/dapp';
import { arraify } from '@/isomorphic/array';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
} from '../utils/ipcMainEvents';
import { PERSIS_STORE_PREFIX } from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import {
  canoicalizeDappUrl,
  isUrlFromDapp,
  maybeTrezorLikeBuiltInHttpPage,
  parseDomainMeta,
} from '../../isomorphic/url';
import { detectDapp } from '../utils/dapps';
import { storeLog } from '../utils/log';
import { makeStore } from '../utils/store';
import { getAppProxyConfigForAxios } from './desktopApp';

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

const IProtocolBindingSchema: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    origin: { type: 'string' },
    siteUrl: { type: 'string' },
  },
};

export const dappStore = makeStore<{
  dapps: IDapp[];
  protocolDappsBinding: Record<string, IDapp['origin'][]>;
  dappsMap: Record<IDapp['origin'], IDapp>;
  pinnedList: string[];
  unpinnedList: string[];
}>({
  name: `${PERSIS_STORE_PREFIX}dapps`,

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
        '^https?://.+$': IProtocolBindingSchema,
      },
      default: {} as IProtocolDappBindings,
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
      const dapps = formatDapps(store.get('dapps') || []);

      let dappsMap = store.get('dappsMap');
      if ((!dappsMap || !Object.keys(dappsMap).length) && dapps.length) {
        dappsMap = dapps.reduce((acc, dapp) => {
          if (dapp.origin) acc[dapp.origin] = dapp;
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

  return result;
}

export function findDappsByOrigin(
  dappOrigin: string,
  dapps: IDapp[] = getAllDapps()
) {
  const secondaryOrigin = canoicalizeDappUrl(dappOrigin).secondaryOrigin;

  const result = {
    dappByOrigin: null as null | IDapp,
    dappBySecondaryDomainOrigin: null as null | IDapp,
  };
  dapps.find((dapp) => {
    if (dapp.origin === dappOrigin) {
      result.dappByOrigin = dapp;
    }

    if (dapp.origin === secondaryOrigin) {
      result.dappBySecondaryDomainOrigin = dapp;
    }

    return result.dappByOrigin && result.dappBySecondaryDomainOrigin;
  });

  return result;
}

export function getProtocolDappsBindings() {
  const protocolDappsBinding = dappStore.get('protocolDappsBinding') || {};

  return normalizeProtocolBindingValues(protocolDappsBinding);
}

function parseDappUrl(url: string, dapps = getAllDapps()) {
  const {
    isDapp,
    origin,
    secondaryDomain,
    secondaryOrigin,
    is2ndaryDomain,
    isSubDomain,
  } = canoicalizeDappUrl(url);

  const matches = {
    foundDapp: null as null | IDapp,
    foundMainDomainDapp: null as null | IDapp,
  };

  if (isDapp) {
    const findResult = findDappsByOrigin(origin, dapps);
    matches.foundDapp = findResult.dappByOrigin;
    matches.foundMainDomainDapp = findResult.dappBySecondaryDomainOrigin;
  }

  return {
    isDapp,
    origin,
    secondaryDomain,
    is2ndaryDomain,
    isSubDomain,
    ...matches,
    existedDapp: !isDapp ? false : !!matches.foundDapp,
  };
}

export function parseDappRedirect(
  currentURL: string,
  targetURL: string,
  opts?: {
    dapps?: IDapp[];
    isForTrezorLikeConnection?: boolean;
  }
) {
  const { dapps = getAllDapps(), isForTrezorLikeConnection = false } =
    opts || {};

  const isFromDapp = isUrlFromDapp(currentURL);

  const currentInfo = parseDappUrl(currentURL, dapps);
  const targetInfo = parseDappUrl(targetURL, dapps);
  const isToSameOrigin = currentInfo.origin === targetInfo.origin;

  const domainMetaCache: Record<
    I2ndDomainMeta['secondaryDomain'],
    I2ndDomainMeta
  > = {};
  parseDomainMeta(currentURL, dapps, domainMetaCache);
  parseDomainMeta(targetURL, dapps, domainMetaCache);

  const couldKeepTab =
    currentInfo.secondaryDomain === targetInfo.secondaryDomain &&
    !!domainMetaCache[currentInfo.secondaryDomain]
      ?.secondaryDomainOriginExisted;
  const allowOpenTab =
    !!domainMetaCache[targetInfo.secondaryDomain]?.secondaryDomainOriginExisted;

  const maybeRedirectInSPA = isFromDapp && isToSameOrigin;

  const isToExtension = targetURL.startsWith('chrome-extension://');

  let shouldOpenExternal = false;
  if (
    isForTrezorLikeConnection &&
    !isToExtension &&
    !maybeTrezorLikeBuiltInHttpPage(targetURL)
  ) {
    shouldOpenExternal = true;
  }

  return {
    currentInfo,
    targetInfo,

    isFromDapp,
    isToSameOrigin,
    couldKeepTab,
    allowOpenTab,
    shouldOpenExternal,
    maybeRedirectInSPA,
    isToExtension,
  };
}

// const allDapps = getAllDapps();
// detectDapp('https://debank.com', allDapps);

handleIpcMainInvoke('detect-dapp', async (_, dappUrl) => {
  const allDapps = getAllDapps();

  const result = await detectDapp(dappUrl, {
    existedDapps: allDapps,
    proxyOnGrab: getAppProxyConfigForAxios(),
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
  const { unpinnedList } = fillUnpinnedList(
    dapps,
    pinnedList,
    dappStore.get('unpinnedList')
  );

  return {
    dapps,
    pinnedList,
    unpinnedList,
  };
});

function checkAddDapp(
  newDapp: IDapp,
  rets: {
    dappsMap: Record<string, IDapp>;
    unpinnedList: string[];
  }
) {
  const {
    dappsMap = dappStore.get('dappsMap'),
    unpinnedList = dappStore.get('unpinnedList'),
  } = rets || {};
  dappsMap[newDapp.origin] = newDapp;

  unpinnedList.push(newDapp.origin);

  return {
    dappsMap,
    unpinnedList,
  };
}

handleIpcMainInvoke('dapps-post', (_, dapp: IDapp) => {
  const dappsMap = dappStore.get('dappsMap');

  if (dappsMap[dapp.origin]) {
    return {
      error: 'Dapp already exists',
    };
  }

  const addResult = checkAddDapp(dapp, {
    dappsMap,
    unpinnedList: dappStore.get('unpinnedList'),
  });

  dappStore.set('dappsMap', addResult.dappsMap);
  dappStore.set('unpinnedList', addResult.unpinnedList);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    dapps: getAllDapps(),
    unpinnedList: addResult.unpinnedList,
  });

  return {};
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

function checkDelDapp(
  originToDel: IDapp['origin'] | IDapp['origin'][],
  rets: {
    dappsMap: Record<string, IDapp>;
    protocolDappsBinding?: IProtocolDappBindings;
    pinnedList?: IDapp['origin'][];
    unpinnedList?: IDapp['origin'][];
  }
) {
  const originsToDel = arraify(originToDel);
  const originsSet = new Set(originsToDel);

  const {
    dappsMap,
    protocolDappsBinding = getProtocolDappsBindings(),
    pinnedList = dappStore.get('pinnedList').filter((o) => !originsSet.has(o)),
    unpinnedList = dappStore
      .get('unpinnedList')
      .filter((o) => !originsSet.has(o)),
  } = rets;

  originsToDel.forEach((o) => {
    delete dappsMap[o];
  });

  Object.entries(protocolDappsBinding).forEach((dapps) => {
    const [protocol, binding] = dapps;
    if (binding.origin === originToDel) {
      delete protocolDappsBinding[protocol];
    }
  });

  return {
    originsToDel,
    protocolDappsBinding,
    pinnedList,
    unpinnedList,
  };
}

handleIpcMainInvoke('dapps-replace', (_, oldOrigin, newDapp) => {
  const dappsMap = dappStore.get('dappsMap');

  const delResult = checkDelDapp(oldOrigin, { dappsMap });
  emitIpcMainEvent(
    '__internal_main:app:close-tab-on-del-dapp',
    delResult.originsToDel
  );

  const addResult = checkAddDapp(newDapp, {
    dappsMap,
    unpinnedList: delResult.unpinnedList,
  });

  dappStore.set('protocolDappsBinding', delResult.protocolDappsBinding);
  dappStore.set('pinnedList', delResult.pinnedList);

  dappStore.set('dappsMap', addResult.dappsMap);
  dappStore.set('unpinnedList', addResult.unpinnedList);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    dapps: getAllDapps(),
    pinnedList: delResult.pinnedList,
    unpinnedList: delResult.unpinnedList,
    protocolDappsBinding: delResult.protocolDappsBinding,
  });

  return {};
});

handleIpcMainInvoke('dapps-delete', (_, dappToDel: IDapp) => {
  const dappsMap = dappStore.get('dappsMap');
  const dapp = dappsMap[dappToDel.origin];

  if (!dapp) {
    return {
      error: 'Not found',
      dapps: [],
    };
  }

  const delResult = checkDelDapp(dappToDel.origin, { dappsMap });
  emitIpcMainEvent(
    '__internal_main:app:close-tab-on-del-dapp',
    delResult.originsToDel
  );

  dappStore.set('protocolDappsBinding', delResult.protocolDappsBinding);
  dappStore.set('pinnedList', delResult.pinnedList);
  dappStore.set('unpinnedList', delResult.unpinnedList);
  dappStore.set('dappsMap', dappsMap);

  const dapps = getAllDapps();
  emitIpcMainEvent('__internal_main:dapps:changed', {
    dapps,
    pinnedList: delResult.pinnedList,
    unpinnedList: delResult.unpinnedList,
    protocolDappsBinding: delResult.protocolDappsBinding,
  });

  return {
    dapps,
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
  const protocolBindings = getProtocolDappsBindings();

  return {
    result: protocolBindings,
  };
});

handleIpcMainInvoke('dapps-put-protocol-binding', (_, pBindings) => {
  const protocolBindings = getProtocolDappsBindings();
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

    return arraify(pBindings[pLink]).some((item) => {
      if (!dappOrigins.has(item.origin)) {
        errItem = {
          error: `Invalid dapp origin for protocol binding ${item.origin}`,
        };
        return true;
      }
      return false;
    });
  });

  if (errItem) return errItem;

  Object.assign(protocolBindings, pBindings);
  dappStore.set('protocolDappsBinding', protocolBindings);

  emitIpcMainEvent('__internal_main:dapps:changed', {
    protocolDappsBinding: protocolBindings,
  });

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
