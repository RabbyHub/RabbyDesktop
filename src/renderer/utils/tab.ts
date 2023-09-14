import { checkoutDappURL, isOpenedAsHttpDappType } from '@/isomorphic/dapp';
import type { ChromeTabWithOrigin } from '../hooks-shell/useWindowTabs';

export type IDappWithTabInfo = IMergedDapp & {
  tab?: chrome.tabs.Tab;
};

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
  const checkedOutDappInfo =
    dapp.type === 'localfs'
      ? checkoutDappURL(dapp.id)
      : checkoutDappURL(dapp.origin);

  const isOpenedAsHttp = isOpenedAsHttpDappType(checkedOutDappInfo.type);

  const idxToMap = isOpenedAsHttp ? checkedOutDappInfo.dappHttpID : dapp.origin;

  const tab = tabsGroupById[dappBoundTabIds[idxToMap]];
  return tab || null;
}
