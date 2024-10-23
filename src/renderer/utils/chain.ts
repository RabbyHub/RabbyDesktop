import defaultSuppordChain from '@/isomorphic/default-support-chains.json';
import { Chain, CHAINS, CHAINS_ENUM } from '@debank/common';
import {
  ChainWithBalance,
  SupportedChain,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { TestnetChain } from '@/isomorphic/types/customTestnet';
import { CustomTestnetToken } from '@/isomorphic/types/rabbyx';
import BigNumber from 'bignumber.js';
import { intToHex } from './number';

export function supportedChainToChain(item: SupportedChain): Chain {
  const chainServerIdEnumDict: Record<string, string> = {
    eth: 'ETH',
    bsc: 'BSC',
    xdai: 'GNOSIS',
    matic: 'POLYGON',
    ftm: 'FTM',
    okt: 'OKT',
    heco: 'HECO',
    avax: 'AVAX',
    arb: 'ARBITRUM',
    op: 'OP',
    celo: 'CELO',
    movr: 'MOVR',
    cro: 'CRO',
    boba: 'BOBA',
    metis: 'METIS',
    btt: 'BTT',
    aurora: 'AURORA',
    mobm: 'MOBM',
    sbch: 'SBCH',
    hmy: 'HMY',
    fuse: 'FUSE',
    astar: 'ASTAR',
    klay: 'KLAY',
    rsk: 'RSK',
    iotx: 'IOTX',
    kcc: 'KCC',
    wan: 'WAN',
    sgb: 'SGB',
    evmos: 'EVMOS',
    dfk: 'DFK',
    tlos: 'TLOS',
    nova: 'NOVA',
    canto: 'CANTO',
    doge: 'DOGE',
    step: 'STEP',
    kava: 'KAVA',
    mada: 'MADA',
    cfx: 'CFX',
    brise: 'BRISE',
    ckb: 'CKB',
    tomb: 'TOMB',
    pze: 'PZE',
    era: 'ERA',
    eos: 'EOS',
    core: 'CORE',
    flr: 'FLR',
    wemix: 'WEMIX',
    mtr: 'METER',
    etc: 'ETC',
    fsn: 'FSN',
    pls: 'PULSE',
    rose: 'ROSE',
    ron: 'RONIN',
    oas: 'OAS',
    zora: 'ZORA',
    linea: 'LINEA',
    base: 'BASE',
    mnt: 'MANTLE',
    tenet: 'TENET',
    lyx: 'LYX',
    opbnb: 'OPBNB',
    loot: 'LOOT',
    shib: 'SHIB',
    manta: 'MANTA',
    scrl: 'SCRL',
    fx: 'FX',
    beam: 'BEAM',
    pego: 'PEGO',
    zkfair: 'ZKFAIR',
    fon: 'FON',
    bfc: 'BFC',
    alot: 'ALOT',
    xai: 'XAI',
    zeta: 'ZETA',
    rari: 'RARI',
    hubble: 'HUBBLE',
    mode: 'MODE',
    merlin: 'MERLIN',
    dym: 'DYM',
    eon: 'EON',
    blast: 'BLAST',
    sx: 'SX',
    platon: 'PLATON',
    map: 'MAP',
    frax: 'FRAX',
    aze: 'AZE',
    karak: 'KARAK',
  };
  return {
    id: item.community_id,
    enum: (chainServerIdEnumDict[item.id] ||
      item.id.toUpperCase()) as unknown as CHAINS_ENUM,
    name: item.name,
    serverId: item.id,
    hex: intToHex(+item.community_id),
    network: `${item.community_id}`,
    nativeTokenSymbol: item.native_token?.symbol,
    nativeTokenLogo: item.native_token?.logo,
    nativeTokenDecimals: item.native_token?.decimals,
    nativeTokenAddress: item.native_token?.id,
    // needEstimateGas: item.need_estimate_gas,
    scanLink: `${item.explorer_host}/${
      item.id === 'heco' ? 'transaction' : 'tx'
    }/_s_`,
    logo: item.logo_url,
    whiteLogo: item.white_logo_url,
    eip: {
      '1559': item.eip_1559,
    },
  };
}

const store = {
  mainnetList: defaultSuppordChain
    .filter((item) => !item.is_disabled)
    .map((item) => {
      return supportedChainToChain(item);
    }),
  testnetList: [] as TestnetChain[],
};

export const getChainList = (net?: 'mainnet' | 'testnet') => {
  if (net === 'mainnet') {
    return store.mainnetList;
  }
  if (net === 'testnet') {
    return store.testnetList;
  }
  return [...store.mainnetList, ...store.testnetList];
};

export const updateChainStore = (params: Partial<typeof store>) => {
  Object.assign(store, params);
};

export const findChain = (
  params: {
    enum?: CHAINS_ENUM | string | null;
    id?: number | null;
    serverId?: string | null;
    hex?: string | null;
    networkId?: string | null;
    name?: string | null;
  },
  _chainList?: (Chain | TestnetChain)[]
): Chain | TestnetChain | null | undefined => {
  const chainList = _chainList || [
    ...getChainList('mainnet'),
    ...getChainList('testnet'),
  ];
  const { enum: chainEnum, id, serverId, hex, networkId, name } = params;
  if (chainEnum && chainEnum.startsWith('CUSTOM_')) {
    return findChain(
      {
        id: +chainEnum.replace('CUSTOM_', ''),
      },
      _chainList
    );
  }
  const chain = chainList.find(
    (item) =>
      item.enum === chainEnum ||
      (id && +item.id === +id) ||
      item.serverId === serverId ||
      item.hex === hex ||
      item.network === networkId
  );

  return chain;
};

export const DEFAULT_ETH_CHAIN = findChain({
  enum: 'ETH',
})!;

/**
 * @description safe find chain
 */
export function findChainByID(chainId: Chain['id']): Chain | null {
  return !chainId
    ? null
    : findChain({
        id: chainId,
      }) || null;
}

/**
 * @description safe find chain, if not found, return fallback(if provided) or null
 */
export function findChainByEnum(
  chainEnum?: CHAINS_ENUM | string,
  options?: {
    fallback?: true | CHAINS_ENUM;
  }
): Chain | null {
  const fallbackIdx = !options?.fallback
    ? null
    : typeof options?.fallback === 'string'
    ? options?.fallback
    : ('ETH' as const);
  const toFallbackEnum: CHAINS_ENUM | null = fallbackIdx
    ? CHAINS_ENUM[fallbackIdx] || CHAINS_ENUM.ETH
    : null;
  const toFallbackChain = toFallbackEnum ? CHAINS[toFallbackEnum] : null;

  if (!chainEnum) return toFallbackChain;

  return findChain({ enum: chainEnum }) || toFallbackChain;
}

/**
 * @description safe find chain by serverId
 */
export function findChainByServerID(chainId: Chain['serverId']): Chain | null {
  return !chainId ? null : findChain({ serverId: chainId }) || null;
}

export function isTestnet(chainServerId?: string) {
  if (!chainServerId) return false;
  const chain = findChainByServerID(chainServerId);
  if (!chain) return false;
  return !!chain.isTestnet;
}

// export { formatChain } from '@/isomorphic/wallet/chain';
// export type { DisplayChainWithWhiteLogo } from '@/isomorphic/wallet/chain';

export const customTestnetTokenToTokenItem = (
  token: CustomTestnetToken
): TokenItem => {
  const chain = findChain({
    id: token.chainId,
  });
  return {
    id: token.id,
    chain: chain?.serverId || '',
    amount: token.amount,
    raw_amount: token.rawAmount,
    raw_amount_hex_str: `0x${new BigNumber(token.rawAmount || 0).toString(16)}`,
    decimals: token.decimals,
    display_symbol: token.symbol,
    is_core: false,
    is_verified: false,
    is_wallet: false,
    is_scam: false,
    is_suspicious: false,
    logo_url: '',
    name: token.symbol,
    optimized_symbol: token.symbol,
    price: 0,
    symbol: token.symbol,
    time_at: 0,
    price_24h_change: 0,
  };
};

export interface DisplayChainWithWhiteLogo extends ChainWithBalance {
  logo?: string;
  whiteLogo?: string;
}

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
    [item.name, item.enum, item.nativeTokenSymbol].some((i) =>
      i.toLowerCase().includes(searchKeyword)
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
  mainnetList?: Chain[];
  testnetList?: Chain[];
}) {
  const {
    supportChains,
    searchKeyword = '',
    pinned,
    matteredChainBalances,
    netTabKey,
    mainnetList = store.mainnetList,
    testnetList = store.testnetList,
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
    (netTabKey === 'testnet' ? testnetList : mainnetList) || []
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
