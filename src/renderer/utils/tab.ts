import { canoicalizeDappUrl } from '@/isomorphic/url';
import type { ChromeTabWithOrigin } from '../hooks-shell/useWindowTabs';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

export function findTab(
  dapp: IDappWithTabInfo,
  {
    tabMapByOrigin,
    tabMapBySecondaryMap,
  }: {
    tabMapByOrigin: Map<string, ChromeTabWithOrigin>;
    tabMapBySecondaryMap: Map<string, ChromeTabWithOrigin>;
    alwaysKeepDapp?: boolean;
  }
) {
  const urlMeta = canoicalizeDappUrl(dapp.origin);
  const isMainDomainAppWithoutSubDomainsDapp =
    dapp.secondDomainMeta?.is2ndaryDomain &&
    !dapp.secondDomainMeta.subDomains.length;

  const tab = isMainDomainAppWithoutSubDomainsDapp
    ? tabMapBySecondaryMap.get(urlMeta.secondaryDomain) ||
      tabMapByOrigin.get(dapp.origin)
    : tabMapByOrigin.get(dapp.origin);

  return tab;
}
