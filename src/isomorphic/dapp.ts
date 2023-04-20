import {
  DAPP_TYPE_TO_OPEN_AS_HTTP,
  LOCALIPFS_BRAND,
  PROTOCOL_ENS,
} from './constants';
import { ensurePrefix, isInvalidBase64, unPrefix } from './string';
import {
  canoicalizeDappUrl,
  extractIpfsCid,
  extractIpfsInfo,
  formatEnsDappIdURL,
  IPFS_REGEXPS,
  isIpfsHttpURL,
  isURLForIpfsDapp,
  parseDomainMeta,
} from './url';

export function isValidDappAlias(alias: string) {
  return /[\w\d]+/.test(alias);
}

function makeIpfsDappHttpId(
  opts:
    | {
        type: 'ipfs';
        ipfsCid: string;
      }
    | {
        type: 'ens';
        ensAddr: string;
      }
) {
  if (opts.type === 'ens') {
    return `http://${opts.ensAddr}.localens`;
  }

  return `http://${LOCALIPFS_BRAND}.${opts.ipfsCid}`;
}

export function formatEnsDappOrigin(ensAddr: string, ipfsCid?: string) {
  if (ipfsCid) {
    // return `rabby-ipfs://${ensAddr}.localens${ipfsCid ? ensurePrefix(ipfsCid, '/') : ''}`;
    return `rabby-ipfs://${ensAddr}.localens.${ipfsCid}`;
  }

  return `rabby-ens://${ensAddr}.localens`;
}

export function checkoutDappURL(dappPath: string): ICheckedOutDappURL {
  const result = {
    type: 'unknown' as const,
    dappID: '' as const,
    dappOrigin: '' as const,
    dappOriginToShow: '' as const,
    dappHttpID: '' as const,
    dappTabID: '' as const,
    dappURLToPrview: '' as const,
    ipfsCid: '' as const,
    ensAddr: '' as const,
  };

  if (dappPath.startsWith(PROTOCOL_ENS)) {
    const ensAddr = canoicalizeDappUrl(dappPath).hostname;
    return {
      ...result,
      type: 'ens' as const,
      dappID: dappPath,
      dappOrigin: dappPath,
      dappOriginToShow: `ens://${ensAddr}`,
      dappURLToPrview: `rabby-ens://${ensAddr}`,
      dappHttpID: makeIpfsDappHttpId({ type: 'ens', ensAddr }),
    };
  }

  if (dappPath.startsWith('/ipfs/') || isURLForIpfsDapp(dappPath)) {
    const { ipfsCid, addSource, ensAddr } = extractIpfsInfo(dappPath);

    if (addSource === 'ens-addr') {
      return {
        ...result,
        type: 'ens' as const,
        dappID: formatEnsDappIdURL(ensAddr, ipfsCid),
        dappOrigin: formatEnsDappOrigin(ensAddr, ipfsCid),
        dappOriginToShow: `ens://${ensAddr}`,
        dappURLToPrview: `rabby-ipfs://${ipfsCid}`,
        dappHttpID: makeIpfsDappHttpId({ type: 'ens', ensAddr }),
        ipfsCid,
        ensAddr,
      };
    }

    if (!ipfsCid) return result;

    return {
      ...result,
      type: 'ipfs' as const,
      dappID: `rabby-ipfs://${ipfsCid}`,
      dappOrigin: `rabby-ipfs://${ipfsCid}`,
      dappOriginToShow: `ipfs://${ipfsCid}`,
      dappURLToPrview: `rabby-ipfs://${ipfsCid}`,
      dappHttpID: makeIpfsDappHttpId({ type: 'ipfs', ipfsCid }),
      ipfsCid,
    };
  }

  if (dappPath.startsWith('http')) {
    // include https: http:
    const parsedInfo = canoicalizeDappUrl(dappPath);

    const ipfsCid = extractIpfsCid(parsedInfo.origin);

    if (ipfsCid) {
      const dappHttpID = makeIpfsDappHttpId({ type: 'ipfs', ipfsCid });

      return {
        ...result,
        type: 'ipfs' as const,
        dappID: `rabby-ipfs://${ipfsCid}`,
        dappOrigin: `rabby-ipfs://${ipfsCid}`,
        dappOriginToShow: `ipfs://${ipfsCid}`,
        dappURLToPrview: makeIpfsDappHttpId({ type: 'ipfs', ipfsCid }), // pointless for this kind of case
        dappHttpID,
        ipfsCid,
      };
    }

    return {
      ...result,
      type: 'http' as const,
      dappID: parsedInfo.origin,
      dappOrigin: parsedInfo.origin,
      dappOriginToShow: parsedInfo.origin,
      dappURLToPrview: parsedInfo.origin,
      dappHttpID: parsedInfo.origin,
      ipfsCid: '',
    };
  }

  return result;
}

export function formatDapp(
  input: any,
  patchesData?: {
    faviconUrl?: string;
  }
): IDapp | null {
  if (!input?.origin) return null;

  const checkedOutDappURLInfo = checkoutDappURL(input.origin);
  const faviconBase64 = input?.faviconBase64 || ('' as IDapp['faviconBase64']);

  let finalType = input?.type;
  if (checkedOutDappURLInfo.type === 'ipfs') {
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
    extraInfo: {
      ...input?.extraInfo,
      // TODO: narrow down the type of dappAddSource
      dappAddSource:
        finalType === 'http' ? 'https' : input?.extraInfo?.dappAddSource,
    },
  } as IDapp;

  switch (finalType) {
    case 'ens': {
      break;
    }
    case 'ipfs': {
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
  if (!dappURL) return '';

  let normalizedURL;

  const checkedOutDappURLInfo = checkoutDappURL(dappURL);

  if (DAPP_TYPE_TO_OPEN_AS_HTTP.includes(checkedOutDappURLInfo.type as any)) {
    normalizedURL = checkedOutDappURLInfo.dappOriginToShow;
  } else if (IPFS_REGEXPS.ID_IPFS_REGEX.test(dappURL)) {
    normalizedURL = dappURL.replace(
      IPFS_REGEXPS.ID_IPFS_REGEX,
      (_, ipfsCid, pathnameWithPrefixSlash) => {
        const pathname = unPrefix(pathnameWithPrefixSlash, '/');
        return `ipfs://${ipfsCid}/${pathname}`;
      }
    );
  } else if (IPFS_REGEXPS.LOCALENS_REGEX.test(dappURL)) {
    normalizedURL = dappURL.replace(
      IPFS_REGEXPS.LOCALENS_REGEX,
      (_, ensAddr, pathnameWithPrefixSlash) => {
        const pathname = unPrefix(pathnameWithPrefixSlash, '/');
        return `ens://${ensAddr}/${pathname}`;
      }
    );
  } else if (IPFS_REGEXPS.LOCALIPFS_BRAND_REGEX.test(dappURL)) {
    normalizedURL = dappURL.replace(
      IPFS_REGEXPS.LOCALIPFS_BRAND_REGEX,
      (_, ipfsCid, pathnameWithPrefixSlash) => {
        const pathname = unPrefix(pathnameWithPrefixSlash, '/');
        return `ipfs://${ipfsCid}/${pathname}`;
      }
    );
  } else if (IPFS_REGEXPS.LOCALIPFS_MAINDOMAIN_REGEX.test(dappURL)) {
    normalizedURL = dappURL.replace(
      IPFS_REGEXPS.LOCALIPFS_MAINDOMAIN_REGEX,
      (_, ipfsCid, pathnameWithPrefixSlash) => {
        const pathname = unPrefix(pathnameWithPrefixSlash, '/');
        return `ipfs://${ipfsCid}/${pathname}`;
      }
    );
  } else {
    normalizedURL = dappURL;
  }

  return normalizedURL;
}

export function formatDappHttpOrigin(
  dappURL: string | ReturnType<typeof checkoutDappURL>
): string {
  if (!dappURL) return dappURL;

  const checkoutResult =
    typeof dappURL === 'string' ? checkoutDappURL(dappURL) : dappURL;

  if (checkoutResult.type === 'ipfs') {
    return checkoutResult.dappHttpID;
  }

  return checkoutResult.dappURLToPrview;
}

export function makeDappURLToOpen(url: string) {
  const isIpfs = isIpfsHttpURL(url);
  if (isIpfs) {
    const ipfsCid = extractIpfsCid(url);
    return `rabby-ipfs://${ipfsCid}`;
  }
  return url;
}

export function formatDappToStore(
  retDapp: IDappPartial,
  options?: {
    dappAddSource?: (INextDapp['extraInfo'] & object)['dappAddSource'] & string;
  }
): IDapp {
  if (isURLForIpfsDapp(retDapp.origin)) {
    const ipfsCid = extractIpfsCid(retDapp.origin);

    let dappId = `rabby-ipfs://${ipfsCid}`;
    if (retDapp?.extraInfo?.ensAddr) {
      dappId = formatEnsDappIdURL(retDapp?.extraInfo?.ensAddr, ipfsCid);
    }

    retDapp.id = dappId;
    retDapp.type = 'ipfs';

    retDapp.extraInfo = {
      ...retDapp.extraInfo,
      ipfsCid: ipfsCid || extractIpfsCid(retDapp.id),
      dappAddSource:
        retDapp?.extraInfo?.dappAddSource ||
        options?.dappAddSource ||
        'ipfs-cid',
    };
  } else {
    retDapp.id = retDapp.origin;

    retDapp.type = 'http';
    retDapp.extraInfo = {
      ...retDapp.extraInfo,
      dappAddSource: 'https',
    };
  }

  return retDapp as IDapp;
}
