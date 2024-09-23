import defaultSuppordChain from '@/isomorphic/default-support-chains.json';
import { Chain } from '@debank/common';
import { SupportedChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
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

export const updateChainStore = (params: Partial<typeof store>) => {
  Object.assign(store, params);
};

export const findChain = (params: {
  enum?: CHAINS_ENUM | string | null;
  id?: number | null;
  serverId?: string | null;
  hex?: string | null;
  networkId?: string | null;
  name?: string | null;
}): Chain | TestnetChain | null | undefined => {
  const { enum: chainEnum, id, serverId, hex, networkId, name } = params;
  if (chainEnum && chainEnum.startsWith('CUSTOM_')) {
    return findChain({
      id: +chainEnum.replace('CUSTOM_', ''),
    });
  }
  const chain = [...store.mainnetList, ...store.testnetList].find(
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

export const getChainList = (net?: 'mainnet' | 'testnet') => {
  if (net === 'mainnet') {
    return store.mainnetList;
  }
  if (net === 'testnet') {
    return store.testnetList;
  }
  return [...store.mainnetList, ...store.testnetList];
};

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
 * @description safe find chain by serverId
 */
export function findChainByServerID(chainId: Chain['serverId']): Chain | null {
  return !chainId ? null : findChain({ serverId: chainId }) || null;
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
