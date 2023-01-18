export function isValidDappAlias(alias: string) {
  return /[\w\d]+/.test(alias);
}

export function formatDapp(input: any) {
  if (!input?.origin) return null;

  return {
    alias: input?.alias || ('' as IDapp['alias']),
    origin: input.origin as IDapp['origin'],
    faviconUrl: input?.faviconUrl || ('' as IDapp['faviconUrl']),
    faviconBase64: input?.faviconBase64 || ('' as IDapp['faviconBase64']),
  };
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

export function sortDappsBasedPinned(
  dapps: IDapp[],
  pinnedList: string[],
  unpinnedList: string[]
) {
  const dappsHash = dapps.reduce((acc, dapp) => {
    acc[dapp.origin] = dapp;
    return acc;
  }, {} as Record<IDapp['origin'], IDapp>);

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
