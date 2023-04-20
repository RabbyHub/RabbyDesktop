import { checkoutDappURL } from '@/isomorphic/dapp';
import { canoicalizeDappUrl, extractDappInfoFromURL } from '@/isomorphic/url';
import { DAPP_TYPE_TO_OPEN_AS_HTTP } from '@/isomorphic/constants';
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
  const idxToMap = DAPP_TYPE_TO_OPEN_AS_HTTP.includes(
    extractDappInfoFromURL(dapp.origin).type
  )
    ? checkoutDappURL(dapp.origin).dappHttpID
    : dapp.origin;
  const tabId = dappBoundTabIds[idxToMap];
  const tab = tabsGroupById[tabId];

  return tab || null;
}
