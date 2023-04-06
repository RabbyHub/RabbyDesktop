import { isBoolean } from 'lodash';
import BigNumber from 'bignumber.js';
import { ERROR } from '../../error';
import { tokenPrice } from './price';
import {
  AssetWithRewards,
  FundingAsset,
  FundingWalletResponse,
  IsolatedMarginAccountInfoResponse,
  MarginAccountResponse,
  PermissionResponse,
  SavingsCustomizedPositionResponse,
  SavingsFlexibleProductPositionResponse,
  SpotAsset,
  StakingProductPositionResponse,
  UserAssetResponse,
} from './type';
import { valueGreaterThan10, plusBigNumber } from '../../util';

export class Binance {
  apiKey: string;

  apiSecret: string;

  // 总资产余额
  private totalBalance = new BigNumber(0);

  // 资产余额（排除小于 10u 的资产）
  private balance = new BigNumber(0);

  plusBalance(value: string) {
    if (valueGreaterThan10(value)) {
      this.balance = this.balance.plus(value);
    }
    this.totalBalance = this.totalBalance.plus(value);
  }

  getTotalBalance() {
    return this.totalBalance.toString();
  }

  getBalance() {
    return this.balance.toString();
  }

  resetBalance() {
    this.totalBalance = new BigNumber(0);
    this.balance = new BigNumber(0);
  }

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
    const res = await this.invoke<PermissionResponse>('apiPermissions');
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
    this.resetBalance();
    // 获取所有资产
    const assets = await Promise.all([
      this.fundingWallet(),
      this.userAsset(),
      this.marginAccount(),
      this.isolatedMarginAccountInfo(),
      this.savingsFlexibleProductPosition(),
      this.savingsCustomizedPosition(),
      this.stakingProductPosition('STAKING'),
    ]);

    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();

    console.log(assets);

    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
      spotAsset: this.calcSpotAsset(assets[1]),
      marginAsset: this.calcMarginAccount(assets[2]),
      isolatedMarginAsset: this.calcIsolatedMarginAccount(assets[3]),
      financeAsset: {
        flexible: this.calcFlexible(assets[4]),
        fixed: this.calcFixed(assets[5]),
        stake: this.calcStake(assets[6]),
      },
    };

    return result;
  }

  private async fundingWallet() {
    const res = await this.invoke<FundingWalletResponse>('fundingWallet');

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcFundingAsset(res: FundingWalletResponse): FundingAsset {
    return res
      .map((item) => {
        const asset = item.asset;
        const value = plusBigNumber(item.free, item.locked, item.freeze);
        const usdtValue = tokenPrice.getUSDTValue(asset, value);

        this.plusBalance(usdtValue);

        return {
          asset,
          value,
          usdtValue,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async userAsset() {
    const res = await this.invoke<UserAssetResponse>('userAsset');

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcSpotAsset(res: UserAssetResponse): SpotAsset {
    return res
      .map((item) => {
        const asset = item.asset;
        const value = plusBigNumber(item.free, item.locked, item.freeze);
        const usdtValue = tokenPrice.getUSDTValue(asset, value);

        this.plusBalance(usdtValue);

        return {
          asset,
          value,
          usdtValue,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async marginAccount() {
    const res = await this.invoke<MarginAccountResponse>('marginAccount');
    const checkValues = [
      'borrowed',
      'free',
      'interest',
      'locked',
      'netAsset',
    ] as const;

    res.userAssets.forEach((item) => {
      if (checkValues.every((key) => item[key] === '0')) {
        return;
      }

      tokenPrice.addSymbol(item.asset);
    });

    return res;
  }

  // TODO
  private calcMarginAccount(res: MarginAccountResponse) {}

  private async isolatedMarginAccountInfo() {
    const res = await this.invoke<IsolatedMarginAccountInfoResponse>(
      'isolatedMarginAccountInfo'
    );

    res.assets.forEach((item) => {
      tokenPrice.addSymbol(item.baseAsset.asset);
      tokenPrice.addSymbol(item.quoteAsset.asset);
    });

    return res;
  }

  // TODO
  private calcIsolatedMarginAccount(res: IsolatedMarginAccountInfoResponse) {}

  private async savingsFlexibleProductPosition() {
    const res = await this.invoke<SavingsFlexibleProductPositionResponse>(
      'savingsFlexibleProductPosition'
    );

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcFlexible(
    res: SavingsFlexibleProductPositionResponse
  ): AssetWithRewards[] {
    return res
      .map((item) => {
        const asset = item.asset;
        const value = item.totalAmount;
        const usdtValue = tokenPrice.getUSDTValue(asset, value);

        this.plusBalance(usdtValue);

        return {
          asset,
          value,
          usdtValue,
          rewards: item.totalBonusRewards,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  // 国内测不了
  private async savingsCustomizedPosition() {
    const res = await this.invoke<SavingsCustomizedPositionResponse>(
      'savingsCustomizedPosition'
    );

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcFixed(res: SavingsCustomizedPositionResponse) {
    return res
      .map((item) => {
        const asset = item.asset;
        const value = item.principal;
        const usdtValue = tokenPrice.getUSDTValue(asset, value);

        this.plusBalance(usdtValue);

        return {
          asset,
          value,
          usdtValue,
          rewards: item.interest,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async stakingProductPosition(type: string) {
    const res = await this.invoke<StakingProductPositionResponse>(
      'stakingProductPosition',
      [type]
    );

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  // TODO 重新对下数据结构
  private calcStake(res: StakingProductPositionResponse) {
    return res
      .map((item) => {
        const asset = item.asset;
        const value = item.amount;
        const usdtValue = tokenPrice.getUSDTValue(asset, value);

        this.plusBalance(usdtValue);

        return {
          asset,
          value,
          usdtValue,
          rewards: item.rewardAmt,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
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
