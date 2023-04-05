import { isBoolean } from 'lodash';
import { ERROR } from '../../error';
import { tokenPrice } from './price';
import {
  FundingAsset,
  FundingWalletResponse,
  SpotAsset,
  UserAssetResponse,
} from './type';
import { plusBigNumber } from '../util';

export class Binance {
  apiKey: string;

  apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private async invoke<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke('binance-sdk', {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
        method,
        params,
      });
    } catch (e) {
      throw new Error(ERROR.INVALID_KEY);
    }
  }

  /**
   * 只允许只读权限
   * 错误类型
   *  - key 不对
   *  - 权限不对
   */
  async checkPermission() {
    const res = await this.invoke<{
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
    }>('apiPermissions');

    const allowed = ['enableReading'];

    Object.keys(res).forEach((key) => {
      const value = res[key as keyof typeof res];
      if (isBoolean(value)) {
        if (allowed.includes(key) && !value) {
          throw new Error(ERROR.PERMISSION_ERROR);
        }
        if (!allowed.includes(key) && value) {
          throw new Error(ERROR.PERMISSION_ERROR);
        }
      }
    });
  }

  // 获取所有资产，并计算总价值
  async getAssets() {
    // 获取所有资产
    const assets = await Promise.all([
      this.fundingWallet(),
      this.userAsset(),
      this.marginAccount(),
      this.isolatedMarginAccountInfo(),
      this.savingsAccount(),
      this.stakingProductPosition('STAKING'),
    ]);

    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();

    console.log(assets);

    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
      spotAsset: this.calcSpotAsset(assets[1]),
    };

    return result;
  }

  private async fundingWallet() {
    const res = await this.invoke<FundingWalletResponse>('fundingWallet');

    res.forEach((item) => {
      tokenPrice.addSymbol(item.asset);
    });

    return res;
  }

  private calcFundingAsset(res: FundingWalletResponse): FundingAsset {
    return res.map((item) => {
      const value = plusBigNumber(item.free, item.locked, item.freeze);
      const usdtValue = tokenPrice.getUSDTValue(item.asset, value);

      return {
        asset: item.asset,
        value,
        usdtValue,
      };
    });
  }

  private async userAsset() {
    const res = await this.invoke<UserAssetResponse>('userAsset');

    res.forEach((item) => {
      tokenPrice.addSymbol(item.asset);
    });

    return res;
  }

  calcSpotAsset(res: UserAssetResponse): SpotAsset {
    return res.map((item) => {
      const value = plusBigNumber(item.free, item.locked, item.freeze);
      const usdtValue = tokenPrice.getUSDTValue(item.asset, value);

      return {
        asset: item.asset,
        value,
        usdtValue,
      };
    });
  }

  private async marginAccount() {
    return this.invoke<{
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
    }>('marginAccount');
  }

  private async isolatedMarginAccountInfo() {
    return this.invoke<{
      assets: [
        {
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
        }
      ];
      totalAssetOfBtc: string;
      totalLiabilityOfBtc: string;
      totalNetAssetOfBtc: string;
    }>('isolatedMarginAccountInfo');
  }

  /**
   * @deprecated
   */
  async savingsFlexibleProductPosition() {
    return this.invoke<
      {
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
      }[]
    >('savingsFlexibleProductPosition');
  }

  // TODO 币安宝定期

  private async stakingProductPosition(type: string) {
    return this.invoke<
      {
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
      }[]
    >('stakingProductPosition', [type]);
  }

  private savingsAccount() {
    return this.invoke<{
      totalAmountInBTC: string;
      totalAmountInUSDT: string;
      totalFixedAmountInBTC: string;
      totalFixedAmountInUSDT: string;
      totalFlexibleInBTC: string;
      totalFlexibleInUSDT: string;
    }>('savingsAccount');
  }

  private async getUSDTPrices() {
    const symbols = tokenPrice.getUSDTSymbols();

    if (!symbols.length) {
      return;
    }

    const result = await this.invoke<
      {
        symbol: string;
        price: string;
      }[]
    >('tickerPrice', [undefined, symbols]);

    tokenPrice.update(result);
  }
}
