import { DAPP_TYPE_TO_OPEN_AS_HTTP, LOCALIPFS_BRAND } from './constants';
import { ensurePrefix, isInvalidBase64 } from './string';
import {
  canoicalizeDappUrl,
  extractDappInfoFromURL,
  extractIpfsCid,
  extractIpfsInfo,
  isIpfsHttpURL,
  parseDomainMeta,
  makeDappAboutURLs,
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
    | {
        type: 'localfs';
        localFSID: string;
      }
) {
  if (opts.type === 'ens') {
    return `http://${opts.ensAddr}.localens`;
  }

  if (opts.type === 'localfs') {
    return `http://${opts.localFSID}.local.fs`;
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

// console.debug('test checkoutDappURL', checkoutDappURL(`file:///C:/Users/admin/path/to`));
export function checkoutDappURL(dappPath: string): ICheckedOutDappURL {
  const result = {
    inputURL: dappPath,
    type: 'unknown' as const,
    dappID: '',
    dappOrigin: '',
    dappOriginToShow: '',
    dappHttpID: '',
    dappURLToPrview: '',
    ipfsCid: '',
    ensAddr: '',
    localFSID: '',
    localFSPath: '',
    pathnameWithQuery: '',
  };

  const dappInfo = extractDappInfoFromURL(dappPath);
  if (dappInfo.type === 'ens') {
    const urls = makeDappAboutURLs({
      type: 'ens',
      ensAddr: dappInfo.ensAddr,
      ipfsCid: dappInfo.ipfsCid,
    });

    return {
      ...result,
      type: 'ens' as const,
      dappID: urls.dappID,
      dappOrigin: dappPath,
      dappOriginToShow: `ens://${dappInfo.ensAddr}`,
      dappURLToPrview: dappInfo.ipfsCid ? urls.dappOrigin : urls.dappID,
      pathnameWithQuery: dappInfo.pathnameWithQuery,
      dappHttpID: makeIpfsDappHttpId({
        type: 'ens',
        ensAddr: dappInfo.ensAddr,
      }),
      ipfsCid: dappInfo.ipfsCid || '',
      ensAddr: dappInfo.ensAddr,
    };
  }

  if (dappPath.startsWith('/ipfs/') || dappInfo.type === 'ipfs') {
    const { ipfsCid, addSource, ensAddr } = extractIpfsInfo(dappPath);

    if (addSource === 'ens-addr') {
      // maybe this is not needed anymore
      return {
        ...result,
        type: 'ens' as const,
        dappID: makeDappAboutURLs({ type: 'ens', ensAddr }).dappID,
        dappOrigin: formatEnsDappOrigin(ensAddr, ipfsCid),
        dappOriginToShow: `ens://${ensAddr}`,
        dappURLToPrview: `rabby-ipfs://${ipfsCid}`,
        pathnameWithQuery: dappInfo.pathnameWithQuery,
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
      pathnameWithQuery: dappInfo.pathnameWithQuery,
      dappHttpID: makeIpfsDappHttpId({ type: 'ipfs', ipfsCid }),
      ipfsCid,
    };
  }

  if (dappInfo.type === 'localfs') {
    const dappHttpID = makeIpfsDappHttpId({
      type: 'localfs',
      localFSID: dappInfo.localFSID,
    });

    return {
      ...result,
      type: 'localfs' as const,
      dappID: dappInfo.fileURLPosix || '',
      dappOrigin: `rabby-fs://${dappInfo.localFSID}`,
      dappOriginToShow: dappInfo.fileURL || '',
      // dappURLToPrview: `rabby-fs://${dappInfo.localFSID}`,
      // dappURLToPrview: `rabby-fs://${dappInfo.localFSID}`,
      dappURLToPrview: `rabby-fs://${dappInfo.localFSID}`,
      pathnameWithQuery: dappInfo.pathnameWithQuery,
      dappHttpID,
      localFSID: dappInfo.localFSID || '',
      localFSPath: dappInfo.localFSPath || '',
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
        pathnameWithQuery: dappInfo.pathnameWithQuery,
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
      pathnameWithQuery: dappInfo.pathnameWithQuery,
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

  // const checkedOutDappURLInfo = checkoutDappURL(input.origin);
  const faviconBase64 = input?.faviconBase64 || ('' as IDapp['faviconBase64']);

  // let finalType = input?.type;
  // if (checkedOutDappURLInfo.type === 'ipfs') {
  //   finalType = 'ipfs';
  // } else if (checkedOutDappURLInfo.type === 'ens') {
  //   finalType = 'ens';
  // } else if (checkedOutDappURLInfo.type === 'localfs') {
  //   finalType = 'localfs';
  // }

  const formattedDapp = {
    id: input.id || input.origin,
    type: input?.type,
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
        input?.type === 'http' ? 'https' : input?.extraInfo?.dappAddSource,
    },
  } as IDapp;

  switch (input?.type) {
    case 'ens': {
      break;
    }
    case 'ipfs': {
      break;
    }
    case 'localfs': {
      break;
    }
    case 'http':
    default: {
      formattedDapp.type = 'http';
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
    if (pinnedSet.has(dapp.id)) {
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
    const dappID = dapp.id;
    if (!pinnedSet.has(dappID) && !unpinnedSet.has(dappID)) {
      otherUnpinnedList.push(dappID);
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
    acc[dapp.id] = dapp;

    if (dapp.type === 'http') {
      const dMeta = parseDomainMeta(dapp.id, dapps, tmpRet);

      secondaryDomainMeta[dMeta.secondaryDomain] =
        secondaryDomainMeta[dMeta.secondaryDomain] || dMeta;

      if (dMeta.is2ndaryDomain) {
        acc[dapp.id].secondDomainMeta = dMeta;
      }
    }
    return acc;
  }, {} as Record<IDapp['id'], IDappWithDomainMeta>);

  const pinnedDapps: IMergedDapp[] = [];
  const unpinnedDapps: IMergedDapp[] = [];

  pinnedList.forEach((dappID) => {
    if (dappsHash[dappID]) {
      pinnedDapps.push({
        ...dappsHash[dappID],
        isPinned: true,
      });
    }
  });

  unpinnedList.forEach((dappID) => {
    if (dappsHash[dappID]) {
      unpinnedDapps.push({
        ...dappsHash[dappID],
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

const VALID_TYPES = ['http', 'ipfs', 'ens', 'localfs'] as IValidDappType[];
export function isValidDappType(type: string): type is IValidDappType {
  return !!type && VALID_TYPES.includes(type as any);
}

export function isOpenedAsHttpDappType(
  type: string
): type is Exclude<IValidDappType, 'http'> {
  return !!type && DAPP_TYPE_TO_OPEN_AS_HTTP.includes(type as any);
}

export function formatDappURLToShow(dappURL: string) {
  if (!dappURL) return '';

  let normalizedURL;

  const checkedOutDappURLInfo = checkoutDappURL(dappURL);

  if (isOpenedAsHttpDappType(checkedOutDappURLInfo.type)) {
    if (
      checkedOutDappURLInfo.type === 'localfs' &&
      !checkedOutDappURLInfo.localFSPath
    ) {
      return checkedOutDappURLInfo.dappOrigin;
    }

    normalizedURL = checkedOutDappURLInfo.dappOriginToShow;
  } else {
    normalizedURL = dappURL;
  }

  return normalizedURL;
}

export function getDappURLToShow(dapp: IDappPartial) {
  if (dapp.id) return formatDappURLToShow(dapp.id);
  if (dapp.origin) return formatDappURLToShow(dapp.origin);

  return '';
}

export function formatDappHttpOrigin(
  dappURL: string | ICheckedOutDappURL
): string {
  if (!dappURL) return dappURL;

  const checkoutResult =
    typeof dappURL === 'string' ? checkoutDappURL(dappURL) : dappURL;

  switch (checkoutResult.type) {
    case 'ipfs':
    case 'ens':
    case 'localfs': {
      return checkoutResult.dappHttpID;
    }
    default:
      break;
  }

  return checkoutResult.dappURLToPrview;
}

// TODO: support ens type?
export function makeDappURLToOpen(url: string) {
  if (isIpfsHttpURL(url)) {
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
  const dappURLInfo = checkoutDappURL(retDapp.id || retDapp.origin);

  if (dappURLInfo.type === 'ens') {
    retDapp.type = 'ens';
    retDapp.id = makeDappAboutURLs({
      type: 'ens',
      ensAddr: dappURLInfo.ensAddr,
    }).dappID;

    retDapp.extraInfo = {
      ...retDapp.extraInfo,
      ensAddr: dappURLInfo.ensAddr,
    };
  } else if (dappURLInfo.type === 'ipfs') {
    let dappId = `rabby-ipfs://${dappURLInfo.ipfsCid}`;
    if (retDapp?.extraInfo?.ensAddr) {
      dappId = makeDappAboutURLs({
        type: 'ens',
        ensAddr: retDapp?.extraInfo?.ensAddr,
      }).dappID;
      retDapp.type = 'ens';
    } else {
      retDapp.type = 'ipfs';
    }

    retDapp.id = dappId;

    retDapp.extraInfo = {
      ...retDapp.extraInfo,
      ipfsCid: dappURLInfo.ipfsCid,
      dappAddSource:
        retDapp?.extraInfo?.dappAddSource ||
        options?.dappAddSource ||
        'ipfs-cid',
    };
  } else if (dappURLInfo.type === 'localfs') {
    if (!dappURLInfo.localFSPath) {
      throw new Error(
        `localFSPath is required on persist dapp, make sure your input dapp partial is valid`
      );
    }
    retDapp.id = dappURLInfo.dappID;
    retDapp.origin = dappURLInfo.dappOrigin;

    retDapp.type = 'localfs';
    retDapp.extraInfo = {
      ...retDapp.extraInfo,
      dappAddSource: 'localfs',
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
