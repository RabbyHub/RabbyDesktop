export type FundingWalletResponse = {
  asset: string;
  free: string;
  locked: string;
  freeze: string;
  withdrawing: string;
  btcValuation: string;
}[];

type Asset = {
  asset: string;
  value: string;
  usdtValue: string;
};

export type UserAssetResponse = {
  asset: string;
  free: string;
  locked: string;
  freeze: string;
  withdrawing: string;
  btcValuation: string;
  ipoable: string;
}[];

export type MarginAccountResponse = {
  tradeEnabled: string;
  transferEnabled: string;
  borrowEnabled: string;
  marginLevel: string;
  totalAssetOfBtc: string;
  totalLiabilityOfBtc: string;
  totalNetAssetOfBtc: string;
  userAssets: {
    asset: string;
    free: string;
    locked: string;
    borrowed: string;
    interest: string;
    netAsset: string;
  }[];
};

// 资金账户
export type FundingAsset = Asset[];

// 现货账户
export type SpotAsset = Asset[];

// 理财账户
export type FinanceAsset = {
  // 定期
  fixed: Asset;
  // 活期
  flexible: Asset;
  // stake
  stake: Asset;
};

// 全仓杠杆账户
// export type MarginAsset = {};
