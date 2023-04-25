/// <reference path="../../isomorphic/types.d.ts" />

import { nativeImage } from 'electron';
import logger from 'electron-log';

import {
  fillUnpinnedList,
  formatDapp,
  formatDapps,
  isValidDappType,
  checkoutDappURL,
  normalizeProtocolBindingValues,
  formatDappToStore,
  matchDappsByOrigin,
} from '@/isomorphic/dapp';
import { arraify } from '@/isomorphic/array';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  onIpcMainSyncEvent,
} from '../utils/ipcMainEvents';
import {
  EnumOpenDappAction,
  PERSIS_STORE_PREFIX,
  PROTOCOL_LOCALFS,
} from '../../isomorphic/constants';
import { safeParse, shortStringify } from '../../isomorphic/json';
import {
  canoicalizeDappUrl,
  extractDappInfoFromURL,
  getOriginFromUrl,
  isUrlFromDapp,
  maybeTrezorLikeBuiltInHttpPage,
  parseDomainMeta,
} from '../../isomorphic/url';
import {
  detectEnsDapp,
  detectHttpDapp,
  detectIPFSDapp,
  detectLocalDapp,
} from '../utils/dapps';
import { storeLog } from '../utils/log';
import { makeStore } from '../utils/store';
import { getOptionProxyForAxios } from './desktopApp';
import { fetchImageBuffer } from '../utils/fetch';
import { getIpfsService } from '../utils/stream-helpers';

const IDappSchema: import('json-schema-typed').JSONSchema = {
  type: 'object',
  properties: {
    alias: { type: 'string' },
    // stricted canonical url, only includes protocols, host(maybe with port), pathname
    origin: { type: 'string' },
    faviconUrl: { type: 'string' },
    faviconBase64: { type: 'string' },
    type: {
      type: 'string',
      enum: ['http', 'ipfs', 'ens', 'localfs'] as IValidDappType[],
      default: 'http',
    },
    extraInfo: {
      type: 'object',
      properties: {
        dappAddSource: {
          type: 'string',
          enum: [
            'https' as IDappAddSource,
            'ipfs-cid' as IDappAddSource,
            'ens-addr' as IDappAddSource,
            'localfs' as IDappAddSource,
          ],
          default: 'https',
        },
        // for ipfs
        ipfsCid: { type: 'string', default: '' },
        // for ens
        ensAddr: { type: 'string', default: '' },
        // for local
        localPath: { type: 'string', default: '' },
      },
    },
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
  protocolDappsBinding: Record<string, IDapp['id'][]>;
  dappsMap: Record<IDapp['id'], IDapp>;
  dappsLastOpenInfos: Record<IDapp['origin'], IDappLastOpenInfo>;
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
        '^(https?|rabby-ipfs|rabby-ens|file)://.+$': IProtocolBindingSchema,
      },
      default: {} as IProtocolDappBindings,
    },
    dappsMap: {
      type: 'object',
      patternProperties: {
        '^(https?|rabby-ipfs|rabby-ens|file)://.+$': IDappSchema,
      },
      additionalProperties: false,
      default: {} as Record<IDapp['origin'], IDapp>,
    },
    dappsLastOpenInfos: {
      type: 'object',
      patternProperties: {
        '^(https?|rabby-ipfs|rabby-ens|rabby-fs)://.+$': {
          type: 'object',
          properties: {
            finalURL: { type: 'string' },
          },
        },
      },
      additionalProperties: false,
      default: {} as Record<IDapp['origin'], IDappLastOpenInfo>,
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
        store.set('dapps', []);
      }
    },
  },
});

(function initStore() {
  /* resort :start */
  const dappsMap = dappStore.get('dappsMap') || {};

  const { pinnedList, unpinnedList } = fillUnpinnedList(
    dappsMap,
    dappStore.get('pinnedList'),
    dappStore.get('unpinnedList')
  );

  dappStore.set('pinnedList', pinnedList);
  dappStore.set('unpinnedList', unpinnedList);
  /* resort :end */

  /* coerce INextDapp :start */
  let changed = false;
  Object.entries({ ...dappsMap }).forEach(([k, v]) => {
    if ((!v.id || !isValidDappType(v.type)) && k.startsWith('http')) {
      changed = true;
      v.id = v.id || v.origin;
      v.type = v.type || 'http';
    } else {
      const urlDappInfo = extractDappInfoFromURL(k);
      switch (urlDappInfo.type) {
        case 'ens':
        case 'http':
        case 'ipfs': {
          changed = true;
          v.type = urlDappInfo.type;
          break;
        }
        case 'localfs': {
          changed = true;
          v.type = urlDappInfo.type;
          const oldId = k;
          // enforce all id to posix file:/// format
          const checkoutedDappURLInfo = checkoutDappURL(oldId);
          v.id = checkoutedDappURLInfo.dappID;
          if (v.id !== oldId) {
            delete dappsMap[oldId];
            v.origin = checkoutedDappURLInfo.dappOrigin;
            dappsMap[v.id] = v;
          }
          break;
        }
        default:
          break;
      }
    }
  });
  if (changed) {
    dappStore.set('dappsMap', dappsMap);
  }
  /* coerce INextDapp :end  */
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
  const cUrlInfo = canoicalizeDappUrl(dappOrigin);
  const secondaryOrigin = cUrlInfo.secondaryOrigin;

  const result: IMatchDappResult = {
    dappByOrigin: null as null | IDapp,
    dappBySecondaryDomainOrigin: null as null | IDapp,
    dapp: null as null | IDapp,
  };
  dapps.find((dapp) => {
    if (dapp.origin === dappOrigin) {
      result.dappByOrigin = dapp;
    } else if (
      dapp.type === 'ipfs' &&
      dapp.origin.toLocaleLowerCase() === cUrlInfo.origin.toLocaleLowerCase()
    ) {
      result.dappByOrigin = dapp;
    }

    if (dapp.origin === secondaryOrigin) {
      result.dappBySecondaryDomainOrigin = dapp;
    }

    return result.dappByOrigin && result.dappBySecondaryDomainOrigin;
  });
  result.dapp = result.dappByOrigin || result.dappBySecondaryDomainOrigin;

  return result;
}
export function findDappsById(
  dappId: IDapp['id'],
  dapps: IDapp[] = getAllDapps()
) {
  const checkoutedDappURLInfo = checkoutDappURL(dappId);

  const dappOriginToMatch = checkoutedDappURLInfo.dappOrigin;
  dappId = checkoutedDappURLInfo.dappID;
  const dappTypeToMatch = checkoutedDappURLInfo.type;

  return dapps.find((dapp) => {
    if (dappTypeToMatch === 'localfs') {
      return dapp.type === 'localfs' && dappOriginToMatch === dapp.origin;
    }
    if (
      dappTypeToMatch === 'ipfs' &&
      dapp.id.toLocaleLowerCase() === dappId.toLocaleLowerCase()
    ) {
      return dapp;
    }

    if (dapp.id === dappId) {
      return dapp;
    }

    return false;
  });
}

export function getProtocolDappsBindings() {
  const protocolDappsBinding = dappStore.get('protocolDappsBinding') || {};

  return normalizeProtocolBindingValues(protocolDappsBinding);
}

function parseDappUrl(url: string, dapps = getAllDapps()) {
  const { isDapp, origin, secondaryDomain, is2ndaryDomain, isSubDomain } =
    canoicalizeDappUrl(url);

  let matches: IMatchDappResult = {
    dappByOrigin: null,
    dappBySecondaryDomainOrigin: null,
    dapp: null,
  };

  if (isDapp) {
    matches = findDappsByOrigin(origin, dapps);
  }

  return {
    isDapp,
    origin,
    secondaryDomain,
    is2ndaryDomain,
    isSubDomain,
    ...matches,
    matchDappResult: matches,
    /** @deprecated */
    existedDapp: !isDapp ? false : !!matches.dappByOrigin,
  };
}

const nullSet = new Set();

export function parseDappRedirect(
  currentURL: string,
  targetURL: string,
  opts?: {
    dapps?: IDapp[];
    blockchain_explorers?: Set<
      (IAppDynamicConfig['blockchain_explorers'] & object)[number]
    >;
    isForTrezorLikeConnection?: boolean;
    isFromExistedTab?: boolean;
    isServerSideRedirect?: boolean;
  }
) {
  const {
    dapps = getAllDapps(),
    blockchain_explorers = nullSet,
    isForTrezorLikeConnection = false,
    isFromExistedTab = false,
    isServerSideRedirect = false,
  } = opts || {};

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

  let finalAction: EnumOpenDappAction = EnumOpenDappAction.deny;

  const couldKeepTab =
    currentInfo.secondaryDomain === targetInfo.secondaryDomain &&
    !!domainMetaCache[currentInfo.secondaryDomain]
      ?.secondaryDomainOriginExisted;
  const allowOpenTab =
    !!domainMetaCache[targetInfo.secondaryDomain]?.secondaryDomainOriginExisted;

  const maybeRedirectInSPA = isFromDapp && isToSameOrigin;

  const isToExtension = targetURL.startsWith('chrome-extension://');

  let shouldOpenExternal = blockchain_explorers.has(targetInfo.secondaryDomain);
  if (
    isForTrezorLikeConnection &&
    !isToExtension &&
    !maybeTrezorLikeBuiltInHttpPage(targetURL)
  ) {
    shouldOpenExternal = true;
    finalAction = EnumOpenDappAction.openExternal;
  } else if (isServerSideRedirect && targetInfo.matchDappResult.dapp) {
    finalAction = EnumOpenDappAction.leaveInTab;
  } else if (
    isFromExistedTab &&
    targetInfo.matchDappResult.dapp &&
    !isToSameOrigin
  ) {
    finalAction = EnumOpenDappAction.safeOpenOrSwitchToAnotherTab;
  } else if (
    isFromExistedTab &&
    currentInfo.matchDappResult.dappBySecondaryDomainOrigin &&
    currentInfo.secondaryDomain === targetInfo.secondaryDomain
  ) {
    finalAction = EnumOpenDappAction.leaveInTab;
  } else if (isFromDapp && !isToSameOrigin) {
    finalAction = EnumOpenDappAction.safeOpenOrSwitchToAnotherTab;
  }

  return {
    currentInfo,
    targetInfo,

    isFromDapp,
    isToSameOrigin,
    /** @deprecated */
    couldKeepTab,
    /** @deprecated */
    allowOpenTab,
    /** @deprecated */
    shouldOpenExternal,
    finalAction,
    maybeRedirectInSPA,
    isToExtension,
  };
}

export async function repairDappsFieldsOnBootstrap() {
  const dappsMap = dappStore.get('dappsMap') || {};

  await Promise.allSettled(
    Object.values(dappsMap).map(async (dapp) => {
      if (dapp.faviconUrl && !dapp.faviconBase64) {
        try {
          const faviconBuf = await fetchImageBuffer(dapp.faviconUrl, {
            timeout: 2 * 1e3,
            proxy: getOptionProxyForAxios(),
          });

          dapp.faviconBase64 = nativeImage
            .createFromBuffer(faviconBuf)
            .toDataURL();
        } catch (error) {
          console.error(
            `[repairDappsFieldsOnBootstrap] fetch favicon error occured: `,
            error
          );
        }
      }
    })
  );

  dappStore.set('dappsMap', dappsMap);
}

// const allDapps = getAllDapps();
// detectHttpDapp('https://debank.com', allDapps);

handleIpcMainInvoke('detect-dapp', async (_, dappUrl) => {
  const allDapps = getAllDapps();

  const checkedOutDappURLInfo = checkoutDappURL(dappUrl);

  if (checkedOutDappURLInfo.type === 'localfs') {
    return {
      result: await detectLocalDapp(
        checkedOutDappURLInfo.dappID.replace(PROTOCOL_LOCALFS, 'file:'),
        {
          existedDapps: allDapps,
        }
      ),
    };
  }

  if (checkedOutDappURLInfo.type === 'ens') {
    return {
      result: await detectEnsDapp(checkedOutDappURLInfo, {
        existedDapps: allDapps,
      }),
    };
  }

  if (checkedOutDappURLInfo.type === 'ipfs') {
    return {
      result: await detectIPFSDapp(checkedOutDappURLInfo.dappID, {
        existedDapps: allDapps,
      }),
    };
  }

  const result = await detectHttpDapp(dappUrl, {
    existedDapps: allDapps,
    proxyOnGrab: getOptionProxyForAxios(),
  });

  return {
    result,
  };
});

handleIpcMainInvoke('get-dapp', (_, dappId) => {
  // TODO: if not found, return error
  const dapp = findDappsById(dappId);

  if (!dapp) {
    return {
      error: `dapp ${dappId} not found`,
      data: {
        dapp: null,
        isPinned: false,
      },
    };
  }

  const isPinned = !!dappStore.get('pinnedList').find((d) => d === dappId);

  return {
    error: null,
    data: {
      dapp,
      isPinned,
    },
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
  inputDapp: IDappPartial,
  rets: {
    dappsMap: Record<string, IDapp>;
    unpinnedList: string[];
  }
) {
  const newDapp = formatDappToStore(inputDapp);

  const {
    dappsMap = dappStore.get('dappsMap'),
    unpinnedList = dappStore.get('unpinnedList'),
  } = rets || {};
  dappsMap[newDapp.id] = newDapp;

  if (!unpinnedList.includes(newDapp.id)) {
    unpinnedList.push(newDapp.id);
  }

  return {
    dappsMap,
    unpinnedList,
  };
}

handleIpcMainInvoke('dapps-post', (_, dapp) => {
  const dappsMap = dappStore.get('dappsMap');

  // TODO: change to use id here
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

handleIpcMainInvoke('dapps-put', (_, dapp) => {
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
  idToDel: IDapp['id'] | IDapp['id'][],
  rets: {
    dappsMap: Record<string, IDapp>;
    dappsLastOpenInfos?: Record<string, IDappLastOpenInfo>;
    protocolDappsBinding?: IProtocolDappBindings;
    pinnedList?: IDapp['id'][];
    unpinnedList?: IDapp['id'][];
  }
) {
  const dappIdsToDel = arraify(idToDel);
  const idsSet = new Set(dappIdsToDel);

  const {
    dappsMap,
    protocolDappsBinding = getProtocolDappsBindings(),
    dappsLastOpenInfos = dappStore.get('dappsLastOpenInfos') || {},
    pinnedList = dappStore.get('pinnedList').filter((o) => !idsSet.has(o)),
    unpinnedList = dappStore.get('unpinnedList').filter((o) => !idsSet.has(o)),
  } = rets;

  dappIdsToDel.forEach((dappID) => {
    delete dappsMap[dappID];
    // delete dappsLastOpenInfos[dappID];

    const urlDappInfo = checkoutDappURL(dappID);
    delete dappsLastOpenInfos[urlDappInfo.dappOrigin];
  });

  Object.entries(protocolDappsBinding).forEach((dapps) => {
    const [protocol, binding] = dapps;
    if (idsSet.has(binding.origin)) {
      delete protocolDappsBinding[protocol];
    }
  });

  return {
    dappIdsToDel,
    dappsLastOpenInfos,
    protocolDappsBinding,
    pinnedList,
    unpinnedList,
  };
}

handleIpcMainInvoke('dapps-replace', (_, oldId, newDapp) => {
  const dappsMap = dappStore.get('dappsMap');

  const delResult = checkDelDapp(oldId, { dappsMap });
  emitIpcMainEvent(
    '__internal_main:app:close-tab-on-del-dapp',
    delResult.dappIdsToDel
  );

  const addResult = checkAddDapp(newDapp, {
    dappsMap,
    unpinnedList: delResult.unpinnedList,
  });

  dappStore.set('protocolDappsBinding', delResult.protocolDappsBinding);
  dappStore.set('pinnedList', delResult.pinnedList);
  dappStore.set('dappsLastOpenInfos', delResult.dappsLastOpenInfos);

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

handleIpcMainInvoke('dapps-delete', async (_, dappToDel) => {
  const dappsMap = dappStore.get('dappsMap');

  const dappID = dappToDel.id
    ? dappToDel.id
    : checkoutDappURL(dappToDel.origin).dappID;

  const dapp = dappsMap[dappID];

  if (!dapp) {
    return {
      error: 'Not found',
      dapps: [],
    };
  }

  // TODO: change to async process, notice maybe one dir used by ens-ipfs/ipfs together
  try {
    if (dapp?.type === 'ipfs') {
      const dappTypeInfo = checkoutDappURL(dapp.origin);
      const ipfsService = await getIpfsService();
      if (await ipfsService.isExist(dappTypeInfo.ipfsCid)) {
        await ipfsService.removeFile(dappTypeInfo.ipfsCid);
      }
    }
  } catch (err) {
    logger.error(err);
  }

  const delResult = checkDelDapp(dappID, { dappsMap });
  emitIpcMainEvent(
    '__internal_main:app:close-tab-on-del-dapp',
    delResult.dappIdsToDel
  );

  dappStore.set('protocolDappsBinding', delResult.protocolDappsBinding);
  dappStore.set('pinnedList', delResult.pinnedList);
  dappStore.set('unpinnedList', delResult.unpinnedList);
  dappStore.set('dappsLastOpenInfos', delResult.dappsLastOpenInfos);
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

handleIpcMainInvoke('dapps-togglepin', async (_, dappIDs, nextPinned) => {
  const pinnedList = dappStore.get('pinnedList') || [];
  const unpinnedList = dappStore.get('unpinnedList') || [];

  dappIDs.forEach((dappID) => {
    const pinnedIdx = pinnedList.findIndex((o) => o === dappID);
    if (pinnedIdx > -1) {
      pinnedList.splice(pinnedIdx, 1);
    }
    const unpinnedIdx = unpinnedList.findIndex((o) => o === dappID);
    if (unpinnedIdx > -1) {
      unpinnedList.splice(unpinnedIdx, 1);
    }
    if (nextPinned) {
      pinnedList.unshift(dappID);
    } else {
      unpinnedList.push(dappID);
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
    pinnedList = pinnedList
      .map((dappId) => checkoutDappURL(dappId).dappID)
      .filter((dappID) => !!dappID && dappsMap[dappID]);

    const currentPinnedList = dappStore.get('pinnedList');

    if (pinnedList.length !== currentPinnedList.length) {
      return {
        error: 'Invalid Params',
      };
    }
    if (pinnedList.some((dappID) => !dappsMap[dappID])) {
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
      (dappID) => !!dappID && dappsMap[dappID]
    );
    const currentUnpinnedList = dappStore.get('unpinnedList');

    if (unpinnedList.length !== currentUnpinnedList.length) {
      return {
        error: 'Invalid Params',
      };
    }
    if (unpinnedList.some((dappID) => !dappsMap[dappID])) {
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

handleIpcMainInvoke('fetch-dapp-last-open-infos', () => {
  const lastOpenInfos = dappStore.get('dappsLastOpenInfos') || {};
  // TODO: consier one in-memory cache
  const dappsMap = dappStore.get('dappsMap') || {};

  Object.keys(lastOpenInfos).forEach((dappOrigin) => {
    if (!dappsMap[dappOrigin]) delete lastOpenInfos[dappOrigin];
  });

  return {
    error: null,
    lastOpenInfos,
  };
});

onIpcMainEvent(
  '__internal_rpc:debug-tools:operate-debug-insecure-dapps',
  (event, opType) => {
    const dappToAdd: IDapp[] = [
      {
        id: 'https://expired.badssl.com',
        type: 'http',
        alias: 'badssl',
        origin: 'https://expired.badssl.com',
        faviconUrl: '',
        faviconBase64: '',
      },
      {
        id: 'https://expired.badssl.com',
        type: 'http',
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

onIpcMainInternalEvent(
  '__internal_main:mainwindow:dapp-tabs-to-be-closed',
  async ({ tabs: tabsInfo }) => {
    const dappsMap = dappStore.get('dappsMap') || {};
    const dappsLastOpenInfos = dappStore.get('dappsLastOpenInfos') || {};

    let changed = false;
    const allDapps = Object.values(dappsMap);
    // record finalURL of tabs to be closed
    arraify(tabsInfo).forEach((tabInfo) => {
      const finalURL = tabInfo.finalURL;

      const dappOrigin = getOriginFromUrl(finalURL);

      const findResult = findDappsByOrigin(dappOrigin, allDapps);
      const foundDapp =
        findResult.dappByOrigin || findResult.dappBySecondaryDomainOrigin;
      if (!foundDapp) return;

      changed = true;
      dappsLastOpenInfos[foundDapp.origin] = {
        finalURL,
      };
    });

    if (changed) {
      dappStore.set('dappsLastOpenInfos', dappsLastOpenInfos);
    }
  }
);

onIpcMainSyncEvent('__internal_rpc:dapp:get-dapp-by-url', (evt, params) => {
  const { dappURL } = params;

  let foundDapp = null;

  try {
    foundDapp = matchDappsByOrigin(dappURL, getAllDapps());
  } catch (err) {
    logger.error(err);
  } finally {
    evt.returnValue = {
      dapp: foundDapp,
    };
  }
});
