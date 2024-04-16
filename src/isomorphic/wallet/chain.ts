import { findChain, getChainList } from '@/renderer/utils/chain';
import { Chain } from '@debank/common';
import {
  ChainWithBalance,
  UsedChain,
} from '@rabby-wallet/rabby-api/dist/types';

export interface DisplayChainWithWhiteLogo extends ChainWithBalance {
  logo?: string;
  whiteLogo?: string;
}

export interface DisplayUsedChain extends UsedChain {
  usd_value?: number;
  logo?: string;
  whiteLogo?: string;
}

export const formatUsedChain = (item: UsedChain): DisplayUsedChain => {
  const chain = findChain({
    id: item.community_id,
  });

  return {
    ...item,
    logo: chain?.logo || item.logo_url,
    whiteLogo: chain?.whiteLogo,
  };
};

export const formatChain = (
  item: ChainWithBalance
): DisplayChainWithWhiteLogo => {
  const chain = findChain({
    id: item.community_id,
  });

  return {
    ...item,
    logo: chain?.logo || item.logo_url,
    whiteLogo: chain?.whiteLogo,
  };
};

export { formatChain as formatChainToDisplay };

export function sortChainItems<T extends Chain>(
  items: T[],
  opts?: {
    cachedChainBalances?: {
      [P in Chain['serverId']]?: DisplayChainWithWhiteLogo;
    };
    supportChains?: CHAINS_ENUM[];
  }
) {
  const { cachedChainBalances = {}, supportChains } = opts || {};

  return (
    items
      // .map((item, index) => ({
      //   ...item,
      //   index,
      // }))
      .sort((a, b) => {
        const aBalance = cachedChainBalances[a.serverId]?.usd_value || 0;
        const bBalance = cachedChainBalances[b.serverId]?.usd_value || 0;

        if (!supportChains) {
          return aBalance > bBalance ? -1 : 1;
        }

        if (supportChains.includes(a.enum) && !supportChains.includes(b.enum)) {
          return -1;
        }
        if (!supportChains.includes(a.enum) && supportChains.includes(b.enum)) {
          return 1;
        }

        return aBalance > bBalance ? -1 : 1;
      })
  );
}

function searchChains(options: {
  list: Chain[];
  pinned: string[];
  searchKeyword: string;
}) {
  const { list, pinned } = options;
  let { searchKeyword = '' } = options;

  searchKeyword = searchKeyword?.trim().toLowerCase();
  if (!searchKeyword) {
    return list.filter((item) => !pinned.includes(item.enum));
  }
  const res = list.filter((item) =>
    [item.name, item.enum, item.nativeTokenSymbol].some((item2) =>
      item2.toLowerCase().includes(searchKeyword)
    )
  );
  return res
    .filter((item) => pinned.includes(item.enum))
    .concat(res.filter((item) => !pinned.includes(item.enum)));
}

export function varyAndSortChainItems(deps: {
  supportChains?: CHAINS_ENUM[];
  searchKeyword?: string;
  pinned: CHAINS_ENUM[];
  matteredChainBalances: {
    [x: string]: DisplayChainWithWhiteLogo | undefined;
  };
  netTabKey?: import('@/renderer/components/PillsSwitch/NetSwitchTabs').NetSwitchTabsKey;
}) {
  const {
    supportChains,
    searchKeyword = '',
    pinned,
    matteredChainBalances,
    netTabKey,
  } = deps;

  const unpinnedListGroup = {
    withBalance: [] as Chain[],
    withoutBalance: [] as Chain[],
    disabled: [] as Chain[],
  };
  const pinnedListGroup = {
    withBalance: [] as Chain[],
    withoutBalance: [] as Chain[],
    disabled: [] as Chain[],
  };

  const _all = (
    netTabKey
      ? getChainList(netTabKey)
      : getChainList('mainnet') || getChainList('mainnet')
  ).sort((a, b) => a.name.localeCompare(b.name));

  _all.forEach((item) => {
    const inPinned = pinned.find((pinnedEnum) => pinnedEnum === item.enum);

    if (!inPinned) {
      if (supportChains?.length && !supportChains.includes(item.enum)) {
        unpinnedListGroup.disabled.push(item);
      } else if (!matteredChainBalances[item.serverId]) {
        unpinnedListGroup.withoutBalance.push(item);
      } else {
        unpinnedListGroup.withBalance.push(item);
      }
    } else if (supportChains?.length && !supportChains.includes(item.enum)) {
      pinnedListGroup.disabled.push(item);
    } else if (!matteredChainBalances[item.serverId]) {
      pinnedListGroup.withoutBalance.push(item);
    } else {
      pinnedListGroup.withBalance.push(item);
    }
  });

  const allSearched = searchChains({
    list: _all,
    pinned,
    searchKeyword: searchKeyword?.trim() || '',
  });

  pinnedListGroup.withBalance = sortChainItems(pinnedListGroup.withBalance, {
    supportChains,
    cachedChainBalances: matteredChainBalances,
  });
  unpinnedListGroup.withBalance = sortChainItems(
    unpinnedListGroup.withBalance,
    {
      supportChains,
      cachedChainBalances: matteredChainBalances,
    }
  );
  pinnedListGroup.disabled = sortChainItems(pinnedListGroup.disabled, {
    supportChains,
    cachedChainBalances: matteredChainBalances,
  });
  unpinnedListGroup.disabled = sortChainItems(unpinnedListGroup.disabled, {
    supportChains,
    cachedChainBalances: matteredChainBalances,
  });

  return {
    allSearched,
    matteredList: [
      ...pinnedListGroup.withBalance,
      ...pinnedListGroup.withoutBalance,
      ...unpinnedListGroup.withBalance,
      ...pinnedListGroup.disabled,
    ],
    unmatteredList: [
      ...unpinnedListGroup.withoutBalance,
      ...unpinnedListGroup.disabled,
    ],
  };
}
