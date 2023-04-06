export type PermissionResponse = {
  createTime: number;
  enableFutures: boolean;
  enableInternalTransfer: boolean;
  enableMargin: boolean;
  enableReading: boolean;
  enableSpotAndMarginTrading: boolean;
  enableVanillaOptions: boolean;
  enableWithdrawals: boolean;
  ipRestrict: boolean;
  permitsUniversalTransfer: boolean;
};

export type FundingWalletResponse = {
  asset: string;
  free: string;
  locked: string;
  freeze: string;
  withdrawing: string;
  btcValuation: string;
}[];

export type Asset = {
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

export type IsolatedMarginAccountInfoResponse = {
  assets: {
    baseAsset: {
      // 借贷资产
      asset: string;
      borrowEnabled: boolean;
      borrowed: string;
      free: string;
      interest: string;
      locked: string;
      netAsset: string;
      netAssetOfBtc: string;
      repayEnabled: boolean;
      totalAsset: string;
    };
    quoteAsset: {
      // 抵押资产
      asset: string;
      borrowEnabled: boolean;
      borrowed: string;
      free: string;
      interest: string;
      locked: string;
      netAsset: string;
      netAssetOfBtc: string;
      repayEnabled: boolean;
      totalAsset: string;
    };
    symbol: string;
    isolatedCreated: boolean;
    marginLevel: string;
    marginLevelStatus: string;
    marginRatio: string;
    indexPrice: string;
    liquidatePrice: string;
    liquidateRate: string;
    tradeEnabled: boolean;
    enabled: boolean;
  }[];
  totalAssetOfBtc: string;
  totalLiabilityOfBtc: string;
  totalNetAssetOfBtc: string;
};

export type SavingsFlexibleProductPositionResponse = {
  asset: string;
  productId: string;
  productName: string;
  dailyInterestRate: string;
  annualInterestRate: string;
  totalAmount: string;
  lockedAmount: string;
  freeAmount: string;
  freezeAmount: string;
  totalInterest: string;
  canRedeem: boolean;
  redeemingAmount: string;
  tierAnnualInterestRate: Record<string, string>;
  totalBonusRewards: string;
  totalMarketRewards: string;
  collateralAmount: string;
}[];

export type SavingsCustomizedPositionResponse = {
  asset: string;
  canTransfer: boolean;
  createTimestamp: number;
  duration: number;
  endTime: number;
  interest: string;
  interestRate: string;
  lot: number;
  positionId: number;
  principal: string;
  projectId: string;
  projectName: string;
  purchaseTime: number;
  redeemDate: string;
  startTime: number;
  status: string;
  type: string;
}[];

export type StakingProductPositionResponse = {
  positionId: string;
  projectId: string;
  asset: string;
  amount: string;
  purchaseTime: string;
  duration: string;
  accrualDays: string;
  rewardAsset: string;
  APY: string;
  rewardAmt: string;
  extraRewardAsset: string;
  extraRewardAPY: string;
  estExtraRewardAmt: string;
  nextInterestPay: string;
  nextInterestPayDate: string;
  payInterestPeriod: string;
  redeemAmountEarly: string;
  interestEndDate: string;
  deliverDate: string;
  redeemPeriod: string;
  redeemingAmt: string;
  partialAmtDeliverDate: string;
  canRedeemEarly: boolean;
  renewable: boolean;
  type: string;
  status: string;
}[];

// 资金账户
export type FundingAsset = Asset[];

// 现货账户
export type SpotAsset = Asset[];

export type AssetWithRewards = Asset & {
  rewards: Asset[];
};
// 理财账户
export type FinanceAsset = {
  // 定期
  fixed: AssetWithRewards[];
  // 活期
  flexible: AssetWithRewards[];
  // stake
  stake: AssetWithRewards[];
};

// 全仓杠杆账户
export type MarginAsset = {
  supplies: Asset[];
  borrows: Asset[];
  healthRate: string;
};

// 逐仓杠杆账户
export type IsolatedMarginAsset = MarginAsset[];
