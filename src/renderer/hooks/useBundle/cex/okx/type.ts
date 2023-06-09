export type PermissionResponse = {
  perm: string;
};

export type AssetBalancesResponse = {
  availBal: string;
  bal: string;
  ccy: string;
  frozenBal: string;
}[];

export type IndexTickersResponse = {
  instId: string;
  idxPx: string;
}[];

export type Asset = {
  asset: string;
  value: string;
  usdtValue: string;
};

// 资金账户
export type FundingAsset = Asset[];
