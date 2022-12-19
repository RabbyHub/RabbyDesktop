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
