import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM, DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';

export const SWAP_FEE_ADDRESS = '0x39041F1B366fE33F9A5a79dE5120F2Aee2577ebc';

export const TIPS = {
  securityFail: {
    label:
      'Security verification failed, please contact us in Settings - Discord',
    level: 'danger',
  },
  insufficient: {
    label: 'Insufficient balance',
    level: 'danger',
  },
  quoteFail: {
    label: 'Fail to fetch quotes, please refresh to try again',
    level: 'danger',
  },
  payTokenFail: {
    label: 'Fail to verify the payment token',
    level: 'danger',
  },
  receivingTokenFail: {
    label: 'Fail to verify the receiving token',
    level: 'danger',
  },
  priceDifference: {
    label:
      'The price difference is higher than 5%, which may cause a great loss',
    level: 'warning',
  },
  gasCostFail: {
    label: 'Fail to estimate gas cost',
    level: 'warning',
  },
  priceFail: {
    label:
      'Unable to acquire the USD value, thus unable to compare the price difference',
    level: 'warning',
  },
  highSlippage: {
    label: 'Transaction might be frontrun because of high slippage tolerance',
    level: 'warning',
  },
  lowSlippage: {
    label: 'Transaction might be reverted because of low slippage tolerance',
    level: 'warning',
  },
};

export const DEX = {
  [DEX_ENUM.ONEINCH]: {
    logo: 'rabby-internal://assets/icons/swap/1inch.png',

    name: '1inch',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.ONEINCH],
  },
  [DEX_ENUM.ZEROXAPI]: {
    logo: 'rabby-internal://assets/icons/swap/0xswap.png',
    name: '0x',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.ZEROXAPI],
  },
  [DEX_ENUM.PARASWAP]: {
    logo: 'rabby-internal://assets/icons/swap/paraswap.png',
    name: 'ParaSwap',
    chains: DEX_SUPPORT_CHAINS[DEX_ENUM.PARASWAP],
  },
};

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
  };
};

export const defaultGasFee = {
  base_fee: 0,
  level: 'normal',
  front_tx_count: 0,
  price: 0,
  estimated_seconds: 0,
};
