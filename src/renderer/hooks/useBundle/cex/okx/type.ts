import { Asset } from '../utils/type';

export { Asset } from '../utils/type';

export type PermissionResponse = {
  perm: string;
};

export type AssetBalancesResponse = {
  availBal: string;
  bal: string;
  ccy: string;
  frozenBal: string;
}[];

export type AccountBalanceResponse = {
  adjEq: string;
  mgnRatio: string;
  details: {
    ccy: string;
    availEq: string;
    crossLiab: string;
    cashBal: string;
    availBal: string;
    eq: string;
  }[];
}[];

export type AccountPositionResponse = {
  instId: string;
  instType: 'MARGIN' | 'SWAP' | 'FUTURES' | 'OPTION';
  mgnMode: 'cross' | 'isolated';
  pos: string;
  posCcy: string;
  liab: string;
  liabCcy: string;
  interest: string;
  mgnRatio: string;
}[];

export type IndexTickersResponse = {
  instId: string;
  idxPx: string;
}[];

export type StakingDeFiResponse = {
  protocol: string;
  protocolType: 'staking' | 'defi';
  investData: {
    ccy: string;
    amt: string;
  }[];
  earningData: {
    ccy: string;
    earnings: string;
  }[];
}[];

export type SavingsResponse = {
  ccy: string;
  amt: string;
  earning: string;
}[];

export type AssetWithRewards = {
  assets: Asset[];
  rewards: Asset[];
  usdtValue: string;
};

// 资金账户
export type FundingAsset = Asset[];

// 全仓杠杆账户
export type MarginAsset = {
  supplies: Asset[];
  borrows: Asset[];
  healthRate: string;
};

// 逐仓杠杆账户
export type IsolatedMarginAsset = MarginAsset[];

// staking
export type StakingAsset = AssetWithRewards[];

// 存款
export type SavingsAsset = AssetWithRewards[];
