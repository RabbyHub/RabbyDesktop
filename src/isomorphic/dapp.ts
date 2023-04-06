import { IPFS_LOCALHOST, PROTOCOL_IPFS } from './constants';
import { ensurePrefix, isInvalidBase64 } from './string';
import { canoicalizeDappUrl, extractIpfsCid, parseDomainMeta } from './url';

export function isValidDappAlias(alias: string) {
  return /[\w\d]+/.test(alias);
}

export function normalizeIPFSOrigin(ipfsCid: string) {
  return `http://${ipfsCid}.${IPFS_LOCALHOST}`;
}

export function checkoutDappURL(dappPath: string) {
  if (dappPath.startsWith('/ipfs/') || dappPath.startsWith(PROTOCOL_IPFS)) {
    const ipfsCid = extractIpfsCid(dappPath);

    if (!ipfsCid) return { type: 'unknown' as const, dappURL: '' };

    return {
      type: 'ipfs' as const,
      dappURL: `rabby-ipfs://${ipfsCid}`,
      ipfsCid,
    };
  }

  if (dappPath.startsWith('http')) {
    const parsedInfo = canoicalizeDappUrl(dappPath);

    if (parsedInfo.secondaryDomain === IPFS_LOCALHOST) {
      return {
        type: 'ipfs' as const,
        dappURL: `rabby-ipfs://${parsedInfo.subDomain}`,
        ipfsCid: parsedInfo.subDomain,
      };
    }

    return {
      type: 'http' as const,
      dappURL: dappPath,
    };
  }

  return {
    type: 'unknown' as const,
    dappURL: '',
  };
}

export function makeDappOriginToOpen(
  dappURL: string | ReturnType<typeof checkoutDappURL>,
  sessionType: 'default' | 'preview' = 'default'
): string {
  if (!dappURL) return dappURL;

  const checkoutResult =
    typeof dappURL === 'string' ? checkoutDappURL(dappURL) : dappURL;

  if (sessionType === 'default' && checkoutResult.type === 'ipfs') {
    return `http://${checkoutResult.ipfsCid}.${IPFS_LOCALHOST}`;
  }

  return checkoutResult.dappURL;
}

export function formatDapp(
  input: any,
  patchesData?: {
    faviconUrl?: string;
  }
): IDapp | null {
  if (!input?.origin) return null;

  const parsedDappInfo = checkoutDappURL(input.origin);
  const faviconBase64 = input?.faviconBase64 || ('' as IDapp['faviconBase64']);

  let finalType = input?.type;
  if (parsedDappInfo.type === 'ipfs') {
    finalType = 'ipfs';
  }

  const formattedDapp = {
    id: input.id || input.origin,
    type: finalType,
    alias: input?.alias || ('' as IDapp['alias']),
    origin: input.origin as IDapp['origin'],
    faviconUrl:
      patchesData?.faviconUrl ||
      input?.faviconUrl ||
      ('' as IDapp['faviconUrl']),
    faviconBase64: isInvalidBase64(faviconBase64) ? '' : faviconBase64,
  };

  switch (finalType) {
    case 'ipfs': {
      // formattedDapp.id = formattedDapp.origin = makeDappOriginToOpen(input.origin);
      break;
    }
    case 'http':
    default: {
      input.type = 'http';
      break;
    }
  }

  return formattedDapp;
}

export function formatDapps(input: any): IDapp[] {
  if (!Array.isArray(input)) return [];

  const result: IDapp[] = [];

  input.forEach((item) => {
    const f = formatDapp(item);
    if (!f) return;
    result.push(f);
  });

  return result;
}

export function varyDappPinned(dapps: IDapp[], pinnedList: string[]) {
  const pinnedSet = new Set(pinnedList);

  const pinnedDapps: IDapp[] = [];
  const unpinnedDapps: IDapp[] = [];
  formatDapps(dapps).forEach((dapp) => {
    if (pinnedSet.has(dapp.origin)) {
      pinnedDapps.push(dapp);
    } else {
      unpinnedDapps.push(dapp);
    }
  });

  return {
    pinnedDapps,
    unpinnedDapps,
  };
}

export function fillUnpinnedList(
  dapps: Record<IDapp['origin'], IDapp> | IDapp[],
  pinnedList: string[],
  unpinnedList: string[]
) {
  const pinnedSet = new Set(pinnedList);
  const unpinnedSet = new Set(unpinnedList);

  const otherUnpinnedList: IDapp['origin'][] = [];

  const dappList = Array.isArray(dapps) ? dapps : Object.values(dapps);
  dappList.forEach((dapp) => {
    const dappOrigin = dapp.origin;
    if (!pinnedSet.has(dappOrigin) && !unpinnedSet.has(dappOrigin)) {
      otherUnpinnedList.push(dappOrigin);
    }
  });

  return {
    pinnedList: [...pinnedSet],
    unpinnedList: unpinnedList.concat(otherUnpinnedList),
  };
}

export function isFromSecondaryDomainToUnAddedSubDomain(
  sourceMeta: I2ndDomainMeta,
  targetMeta: I2ndDomainMeta
) {
  return (
    sourceMeta.secondaryDomain === targetMeta.secondaryDomain &&
    !sourceMeta.subDomains.find((d) => {
      return (
        ensurePrefix(d, 'https://') ===
        ensurePrefix(targetMeta.secondaryDomain, 'https://')
      );
    })
  );
}

export function sortDappsBasedPinned(
  dapps: IDapp[],
  pinnedList: string[],
  unpinnedList: string[]
) {
  const secondaryDomainMeta = <
    Record<I2ndDomainMeta['secondaryDomain'], I2ndDomainMeta>
  >{};

  const tmpRet = {} as Parameters<typeof parseDomainMeta>[2];
  const dappsHash = dapps.reduce((acc, dapp) => {
    acc[dapp.origin] = dapp;

    const dMeta = parseDomainMeta(dapp.origin, dapps, tmpRet);
    secondaryDomainMeta[dMeta.secondaryDomain] =
      secondaryDomainMeta[dMeta.secondaryDomain] || dMeta;

    if (dMeta.is2ndaryDomain) {
      acc[dapp.origin].secondDomainMeta = dMeta;
    }
    return acc;
  }, {} as Record<IDapp['origin'], IDappWithDomainMeta>);

  const pinnedDapps: IMergedDapp[] = [];
  const unpinnedDapps: IMergedDapp[] = [];

  pinnedList.forEach((dappOrigin) => {
    if (dappsHash[dappOrigin]) {
      pinnedDapps.push({
        ...dappsHash[dappOrigin],
        isPinned: true,
      });
    }
  });

  unpinnedList.forEach((dappOrigin) => {
    if (dappsHash[dappOrigin]) {
      unpinnedDapps.push({
        ...dappsHash[dappOrigin],
        isPinned: false,
      });
    }
  });

  return {
    secondaryDomainMeta,
    allDapps: pinnedDapps.concat(unpinnedDapps),
    pinnedDapps,
    unpinnedDapps,
  };
}

export function normalizeProtocolBindingValues(
  protocolBindings: Record<string, any>
): IProtocolDappBindings {
  return Object.entries(protocolBindings).reduce((acc, [key, val]) => {
    if (val?.origin && val?.siteUrl) {
      acc[key] = val;
    }

    return acc;
  }, {} as IProtocolDappBindings);
}

const VALID_TYPES = ['http', 'ipfs'];
export function isValidDappType(type: string) {
  return type && VALID_TYPES.includes(type);
}

export function formatDappURLToShow(dappURL: string) {
  if (!dappURL) return dappURL;

  if (dappURL.startsWith(PROTOCOL_IPFS)) {
    return dappURL.replace(/^rabby-ipfs:/, 'ipfs:');
  }

  return dappURL;
}
