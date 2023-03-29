import { canoicalizeDappUrl } from '@/isomorphic/url';
import type { ChromeTabWithOrigin } from '../hooks-shell/useWindowTabs';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

/** @deprecated */
export function findTabByTabURL(
  dapp: IDappWithTabInfo,
  {
    tabMapGroupByRealtimeOrigin,
    tabMapBySecondaryMap,
  }: {
    tabMapGroupByRealtimeOrigin: Map<string, ChromeTabWithOrigin>;
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
      tabMapGroupByRealtimeOrigin.get(dapp.origin)
    : tabMapGroupByRealtimeOrigin.get(dapp.origin);

  return tab;
}
export function findTabByTabID(
  dapp: IDappWithTabInfo,
  {
    tabsGroupById,
    dappBoundTabIds,
  }: {
    tabsGroupById: Record<number, ChromeTabWithOrigin>;
    dappBoundTabIds: IDappBoundTabIds;
  }
) {
  const tabId = dappBoundTabIds[dapp.origin];
  const tab = tabsGroupById[tabId];

  return tab || null;
}
