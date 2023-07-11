import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { DEX_ENUM, DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';

export const SWAP_FEE_ADDRESS = '0x39041F1B366fE33F9A5a79dE5120F2Aee2577ebc';

export const ETH_USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';

export const DEX = {
  [DEX_ENUM.ONEINCH]: {
    id: DEX_ENUM.ONEINCH,
    logo: 'rabby-internal://assets/icons/swap/1inch.png',
    name: '1inch',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.ONEINCH],
  },
  [DEX_ENUM.ZEROXAPI]: {
    id: DEX_ENUM.ZEROXAPI,
    logo: 'rabby-internal://assets/icons/swap/0xswap.png',
    name: '0x',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.ZEROXAPI],
  },
  [DEX_ENUM.PARASWAP]: {
    id: DEX_ENUM.PARASWAP,
    logo: 'rabby-internal://assets/icons/swap/paraswap.png',
    name: 'ParaSwap',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.PARASWAP],
  },
  [DEX_ENUM.OPENOCEAN]: {
    id: DEX_ENUM.OPENOCEAN,
    logo: 'rabby-internal://assets/icons/swap/openocean.png',
    name: 'OpenOcean',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.OPENOCEAN],
  },
};

export const DEX_WITH_WRAP = {
  ...DEX,
  [DEX_ENUM.WRAPTOKEN]: {
    id: DEX_ENUM.WRAPTOKEN,
    logo: 'rabby-internal://assets/icons/common/token-default.svg',
    name: 'Wrap Contract',
    chains: DEX_SUPPORT_CHAINS.WrapToken,
  },
};

export const CEX = {
  binance: {
    id: 'binance',
    name: 'Binance',
    logo: 'rabby-internal://assets/icons/swap/binance.png',
  },
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase',
    logo: 'rabby-internal://assets/icons/swap/coinbase.png',
  },
  okex: {
    id: 'okex',
    name: 'OKX',
    logo: 'rabby-internal://assets/icons/swap/okx.png',
  },
};

export type DEX_TYPE = typeof DEX;

export type CEX_TYPE = typeof CEX;

export const getChainDefaultToken = (chain: CHAINS_ENUM) => {
  const chainInfo = CHAINS[chain];
  return {
    id: chainInfo.nativeTokenAddress,
    decimals: chainInfo.nativeTokenDecimals,
    logo_url: chainInfo.nativeTokenLogo,
    symbol: chainInfo.nativeTokenSymbol,
    display_symbol: chainInfo.nativeTokenSymbol,
    optimized_symbol: chainInfo.nativeTokenSymbol,
    is_core: true,
    is_verified: true,
    is_wallet: true,
    amount: 0,
    price: 0,
    name: chainInfo.nativeTokenSymbol,
    chain: chainInfo.serverId,
    time_at: 0,
  } as TokenItem;
};

export const defaultGasFee = {
  base_fee: 0,
  level: 'normal',
  front_tx_count: 0,
  price: 0,
  estimated_seconds: 0,
};
