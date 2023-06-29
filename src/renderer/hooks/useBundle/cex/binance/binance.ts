import { isBoolean } from 'lodash';
import BigNumber from 'bignumber.js';
import { ERROR } from '../../error';
import { TokenPrice } from '../utils/price';
import {
  AssetWithRewards,
  FundingAsset,
  FundingWalletResponse,
  IsolatedMarginAccountInfoResponse,
  MarginAccountResponse,
  MarginAsset,
  PermissionResponse,
  SavingsCustomizedPositionResponse,
  SavingsFlexibleProductPositionResponse,
  SpotAsset,
  StakingProductPositionResponse,
  UserAssetResponse,
  Asset,
  IsolatedMarginAsset,
  TickerPriceResponse,
  CoinInfoResponse,
  BswapLiquidityResponse,
  BswapUnclaimedRewardsResponse,
  USDFuturesAccountResponse,
  TokenFuturesAccountResponse,
} from './type';
import { bigNumberSum, valueGreaterThanThreshold } from '../../util';
import { Cex } from '../utils/cex';

// 不在该数组中的资产，不应被统计
let enableTokens: string[] = [];
const filterAsset = (data: { asset: string }) => {
  return enableTokens.includes(data.asset);
};

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
}

export const tokenPrice = new TokenPrice();

export class Binance extends Cex<BinanceConfig> {
  static cexName = 'Binance';

  constructor({
    apiKey,
    apiSecret,
    enableInvalidKeyModal = true,
    nickname,
  }: {
    apiKey: string;
    apiSecret: string;
    enableInvalidKeyModal?: boolean;
    nickname?: string;
  }) {
    super();
    this.config = {
      apiKey,
      apiSecret,
    };
    this.enableInvalidKeyModal = enableInvalidKeyModal;
    this.nickname = nickname;
  }

  async invoke<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke('binance-sdk', {
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        method,
        params,
      });
    } catch (e: any) {
      if (e.message.includes(ERROR.INVALID_KEY)) {
        this.showInvalidKeyModal(this.config.apiKey);
      }
      // 未知错误
      throw new Error(ERROR.UNKNOWN);
    }
  }

  async invokeUSDFutures<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke(
        'binance-usd-futures-sdk',
        {
          apiKey: this.config.apiKey,
          apiSecret: this.config.apiSecret,
          method,
          params,
        }
      );
    } catch (e: any) {
      if (e.message.includes(ERROR.INVALID_KEY)) {
        this.showInvalidKeyModal(this.config.apiKey);
      }
      // 未知错误
      throw new Error(ERROR.UNKNOWN);
    }
  }

  async invokeTokenFutures<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke(
        'binance-token-futures-sdk',
        {
          apiKey: this.config.apiKey,
          apiSecret: this.config.apiSecret,
          method,
          params,
        }
      );
    } catch (e: any) {
      if (e.message.includes(ERROR.INVALID_KEY)) {
        this.showInvalidKeyModal(this.config.apiKey);
      }
      // 未知错误
      throw new Error(ERROR.UNKNOWN);
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
    // 获取所有资产
    const assets = await Promise.all([
      this.fundingWallet(),
      this.userAsset(),
      this.marginAccount(),
      this.isolatedMarginAccountInfo(),
      this.savingsFlexibleProductPosition(),
      this.savingsCustomizedPosition(),
      this.stakingProductPosition('STAKING'),
      this.stakingProductPosition('F_DEFI'),
      this.stakingProductPosition('L_DEFI'),
      this.bswapLiquidity(),
      this.USDFutures(),
      this.tokenFutures(),
    ]);

    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();

    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
      spotAsset: this.calcSpotAsset(assets[1]),
      marginAsset: this.calcMarginAccount(assets[2]),
      isolatedMarginAsset: this.calcIsolatedMarginAccount(assets[3]),
      financeAsset: {
        flexible: this.calcFlexible(assets[4]),
        fixed: this.calcFixed(assets[5]),
        stake: [
          ...this.calcStake(assets[6]),
          ...this.calcStake(assets[7]),
          ...this.calcStake(assets[8]),
          ...this.calcBswapLiquidity(assets[9]),
        ],
      },
      usdFutures: this.calcUSDFutures(assets[10]),
      tokenFutures: this.calcTokenFutures(assets[11]),
    };

    const totalBalance = this.getTotalBalance();
    result.fundingAsset = result.fundingAsset.filter((asset) => {
      return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
    });
    result.spotAsset = result.spotAsset.filter((asset) => {
      return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
    });
    result.marginAsset = result.marginAsset
      ? {
          ...result.marginAsset,
          supplies: result.marginAsset.supplies.filter((asset) => {
            return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
          }),
          borrows: result.marginAsset.borrows.filter((asset) => {
            return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
          }),
        }
      : result.marginAsset;
    result.isolatedMarginAsset = result.isolatedMarginAsset.map((item) => {
      return {
        ...item,
        supplies: item.supplies.filter((asset) =>
          valueGreaterThanThreshold(asset.usdtValue, totalBalance)
        ),
        borrows: item.borrows.filter((asset) =>
          valueGreaterThanThreshold(asset.usdtValue, totalBalance)
        ),
      };
    });
    result.financeAsset = {
      flexible: result.financeAsset.flexible.map((item) => {
        return {
          ...item,
          assets: item.assets.filter((asset) =>
            valueGreaterThanThreshold(asset.usdtValue, totalBalance)
          ),
        };
      }),
      fixed: result.financeAsset.fixed.map((item) => {
        return {
          ...item,
          assets: item.assets.filter((asset) =>
            valueGreaterThanThreshold(asset.usdtValue, totalBalance)
          ),
        };
      }),
      stake: result.financeAsset.stake.map((item) => {
        return {
          ...item,
          assets: item.assets.filter((asset) =>
            valueGreaterThanThreshold(asset.usdtValue, totalBalance)
          ),
        };
      }),
    };
    result.usdFutures = result.usdFutures.filter((asset) =>
      valueGreaterThanThreshold(asset.usdtValue, totalBalance)
    );
    result.tokenFutures = result.tokenFutures.filter((asset) =>
      valueGreaterThanThreshold(asset.usdtValue, totalBalance)
    );
    return result;
  }

  private async bswapLiquidity() {
    const all = await this.invoke<BswapLiquidityResponse>('bswapLiquidity');
    const list = all.filter((item) => item.share.shareAmount > 0);
    const allRewards = await this.invoke<BswapUnclaimedRewardsResponse>(
      'bswapUnclaimedRewards',
      [
        {
          type: 1,
        },
      ]
    );

    return list.map((item) => {
      const rewards = allRewards.details[item.poolName];

      Object.keys(item.share.asset).forEach((o) => tokenPrice.addSymbol(o));
      Object.keys(rewards).forEach((o) => tokenPrice.addSymbol(o));

      return {
        assets: item.share.asset,
        rewards,
      };
    });
  }

  private calcTokenFutures(res: TokenFuturesAccountResponse | undefined) {
    if (!res) return [];
    return res.assets.map((asset) => {
      const usdtValue = tokenPrice.getUSDTValue(
        asset.asset,
        asset.marginBalance
      );
      this.plusBalance(usdtValue);
      return {
        asset: asset.asset,
        value: asset.marginBalance,
        usdtValue,
      };
    });
  }

  private calcUSDFutures(res: USDFuturesAccountResponse | undefined) {
    if (!res) return [];
    return res.assets.map((asset) => {
      const usdtValue = tokenPrice.getUSDTValue(
        asset.asset,
        asset.marginBalance
      );
      this.plusBalance(usdtValue);
      return {
        asset: asset.asset,
        value: asset.marginBalance,
        usdtValue,
      };
    });
  }

  private calcBswapLiquidity(
    res: Awaited<ReturnType<Binance['bswapLiquidity']>>
  ): AssetWithRewards[] {
    return res.map((item) => {
      const assets = Object.keys(item.assets).map((key) => {
        const value = item.assets[key].toString();
        const usdtValue = tokenPrice.getUSDTValue(key, value);
        this.plusBalance(usdtValue);
        return {
          asset: key,
          value,
          usdtValue,
        };
      });
      const rewards = Object.keys(item.rewards).map((key) => {
        const value = item.rewards[key].toString();
        const usdtValue = tokenPrice.getUSDTValue(key, value);
        this.plusBalance(usdtValue);
        return {
          asset: key,
          value,
          usdtValue,
        };
      });
      rewards.forEach((r) => {
        const index = assets.findIndex((a) => a.asset === r.asset);
        if (index === -1) {
          assets.push(r);
        } else {
          assets[index].usdtValue = bigNumberSum(
            assets[index].usdtValue,
            r.usdtValue
          );
          assets[index].value = bigNumberSum(assets[index].value, r.value);
        }
      });
      const usdtValue = bigNumberSum(...assets.map((o) => o.usdtValue));

      return {
        assets,
        usdtValue,
      };
    });
  }

  private async USDFutures() {
    const res = await this.invokeUSDFutures<
      USDFuturesAccountResponse | undefined
    >('getUSDFutureAccount');
    res?.assets.forEach(({ asset }) => tokenPrice.addSymbol(asset));
    return res;
  }

  private async tokenFutures() {
    const res = await this.invokeTokenFutures<
      TokenFuturesAccountResponse | undefined
    >('getTokenFutureAccount');
    res?.assets.forEach(({ asset }) => tokenPrice.addSymbol(asset));
    return res;
  }

  private async fundingWallet() {
    const res = await this.invoke<FundingWalletResponse | undefined>(
      'fundingWallet'
    );

    res?.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res ?? [];
  }

  private calcFundingAsset(res: FundingWalletResponse): FundingAsset {
    return res.filter(filterAsset).map((item) => {
      const asset = item.asset;
      const value = bigNumberSum(item.free, item.locked, item.freeze);
      const usdtValue = tokenPrice.getUSDTValue(asset, value);

      this.plusBalance(usdtValue);

      return {
        asset,
        value,
        usdtValue,
      };
    });
  }

  private async userAsset() {
    const res = await this.invoke<UserAssetResponse | undefined>('userAsset');

    res?.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res ?? [];
  }

  private calcSpotAsset(res: UserAssetResponse): SpotAsset {
    return res.filter(filterAsset).map((item) => {
      const asset = item.asset;
      const value = bigNumberSum(item.free, item.locked, item.freeze);
      const usdtValue = tokenPrice.getUSDTValue(asset, value);

      this.plusBalance(usdtValue);

      return {
        asset,
        value,
        usdtValue,
      };
    });
  }

  private async marginAccount() {
    const res = await this.invoke<MarginAccountResponse>('marginAccount', []);
    const checkValues = [
      'borrowed',
      'free',
      'interest',
      'locked',
      'netAsset',
    ] as const;
    const userAssets: MarginAccountResponse['userAssets'] = [];

    res?.userAssets?.forEach((item) => {
      // 有时候返回的数据是空的
      if (checkValues.every((key) => item[key] === '0')) {
        return;
      }

      userAssets.push(item);
      tokenPrice.addSymbol(item.asset);
    });

    return {
      ...res,
      userAssets,
    };
  }

  private calcMarginAccount(
    res: MarginAccountResponse
  ): MarginAsset | undefined {
    const supplies: Asset[] = [];
    const borrows: Asset[] = [];

    res.userAssets.filter(filterAsset).forEach((item) => {
      const netAssetBN = new BigNumber(item.netAsset);

      if (netAssetBN.gt(0)) {
        const usdtValue = tokenPrice.getUSDTValue(item.asset, item.netAsset);
        supplies.push({
          asset: item.asset,
          value: item.netAsset,
          usdtValue,
        });

        this.plusBalance(usdtValue);
      } else {
        const absValue = netAssetBN.abs().toString();
        const usdtValue = tokenPrice.getUSDTValue(item.asset, absValue);
        borrows.push({
          asset: item.asset,
          value: item.borrowed,
          usdtValue,
        });
      }
    });

    if (!supplies.length && !borrows.length) {
      return undefined;
    }

    return {
      supplies,
      borrows,
      healthRate: res.marginLevel,
    };
  }

  private async isolatedMarginAccountInfo() {
    const res = await this.invoke<IsolatedMarginAccountInfoResponse>(
      'isolatedMarginAccountInfo'
    );
    const assets: IsolatedMarginAccountInfoResponse['assets'] = [];
    const checkValues = [
      'borrowed',
      'free',
      'interest',
      'locked',
      'netAsset',
    ] as const;

    res?.assets?.forEach((item) => {
      // 有时候返回的数据是空的
      if (
        checkValues.every(
          (key) => item.baseAsset[key] === '0' && item.quoteAsset[key] === '0'
        )
      ) {
        return;
      }

      assets.push(item);
      tokenPrice.addSymbol(item.baseAsset.asset);
      tokenPrice.addSymbol(item.quoteAsset.asset);
    });

    return {
      ...res,
      assets,
    };
  }

  private calcIsolatedMarginAccount(
    res: IsolatedMarginAccountInfoResponse
  ): IsolatedMarginAsset {
    return res.assets.map((item) => {
      const assets = [item.baseAsset, item.quoteAsset];
      const supplies: Asset[] = [];
      const borrows: Asset[] = [];

      assets.filter(filterAsset).forEach((o) => {
        const netAssetBN = new BigNumber(o.netAsset);
        const borrowedBN = new BigNumber(o.borrowed);

        if (netAssetBN.gt(0)) {
          const usdtValue = tokenPrice.getUSDTValue(o.asset, o.netAsset);
          supplies.push({
            asset: o.asset,
            value: o.netAsset,
            usdtValue,
          });

          this.plusBalance(usdtValue);
        }
        if (borrowedBN.gt(0)) {
          const usdtValue = tokenPrice.getUSDTValue(o.asset, o.borrowed);
          borrows.push({
            asset: o.asset,
            value: o.borrowed,
            usdtValue,
          });
        }
      });

      return {
        supplies,
        borrows,
        healthRate: item.marginLevel,
      };
    });
  }

  private async savingsFlexibleProductPosition() {
    const res = await this.invoke<
      SavingsFlexibleProductPositionResponse | undefined
    >('savingsFlexibleProductPosition');

    res?.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res ?? [];
  }

  private calcFlexible(
    res: SavingsFlexibleProductPositionResponse
  ): AssetWithRewards[] {
    return res.filter(filterAsset).map((item) => {
      const asset = item.asset;
      const value = new BigNumber(item.totalAmount).toString();
      const tokenUSDTValue = tokenPrice.getUSDTValue(asset, value);
      const rewardUSDTValue = tokenPrice.getUSDTValue(
        asset,
        item.totalInterest
      );
      const usdtValue = bigNumberSum(tokenUSDTValue, rewardUSDTValue);

      this.plusBalance(usdtValue);

      return {
        assets: [
          {
            asset,
            value,
            usdtValue,
          },
        ],
        // rewards: [
        //   {
        //     asset,
        //     value: item.totalInterest,
        //     usdtValue: rewardUSDTValue,
        //   },
        // ],
        usdtValue,
      };
    });
  }

  private async savingsCustomizedPosition() {
    const res = await this.invoke<
      SavingsCustomizedPositionResponse | undefined
    >('savingsCustomizedPosition');

    res?.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res ?? [];
  }

  private calcFixed(
    res: SavingsCustomizedPositionResponse
  ): AssetWithRewards[] {
    return res.filter(filterAsset).map((item) => {
      const asset = item.asset;
      const value = item.principal;
      const tokenUSDTValue = tokenPrice.getUSDTValue(asset, value);
      const rewardUSDTValue = tokenPrice.getUSDTValue(asset, item.interest);
      const usdtValue = bigNumberSum(tokenUSDTValue, rewardUSDTValue);

      this.plusBalance(usdtValue);

      return {
        assets: [
          {
            asset,
            value,
            usdtValue,
          },
        ],
        rewards: [
          {
            asset,
            value: item.interest,
            usdtValue: rewardUSDTValue,
          },
        ],
        usdtValue,
      };
    });
  }

  private async stakingProductPosition(type: string) {
    const res = await this.invoke<StakingProductPositionResponse | undefined>(
      'stakingProductPosition',
      [
        type,
        {
          size: 100,
        },
      ]
    );

    res?.forEach(({ asset, rewardAsset, extraRewardAsset }) => {
      tokenPrice.addSymbol(asset);
      tokenPrice.addSymbol(rewardAsset);
      tokenPrice.addSymbol(extraRewardAsset);
    });

    return res ?? [];
  }

  private calcStake(res: StakingProductPositionResponse): AssetWithRewards[] {
    return res.filter(filterAsset).map((item) => {
      const asset = item.asset;
      const value = item.amount;
      const tokenUSDTValue = tokenPrice.getUSDTValue(asset, value);
      const rewardUSDTValue = tokenPrice.getUSDTValue(
        item.rewardAsset,
        item.rewardAmt
      );
      const extraRewardUSDTValue = tokenPrice.getUSDTValue(
        item.extraRewardAsset,
        item.estExtraRewardAmt
      );
      const usdtValue = bigNumberSum(
        tokenUSDTValue,
        rewardUSDTValue,
        extraRewardUSDTValue
      );

      this.plusBalance(usdtValue);

      const rewards = [
        {
          asset: item.rewardAsset,
          value: item.rewardAmt,
          usdtValue: rewardUSDTValue,
        },
      ];

      if (item.extraRewardAsset) {
        rewards.push({
          asset: item.extraRewardAsset,
          value: item.estExtraRewardAmt,
          usdtValue: extraRewardUSDTValue,
        });
      }

      return {
        assets: [
          {
            asset,
            value,
            usdtValue,
          },
        ],
        rewards,
        usdtValue,
      };
    });
  }

  // 部分 token 查询不到价格，需要过滤掉
  private async filterToken(symbols: string[]) {
    if (!enableTokens.length) {
      const data = await this.invoke<CoinInfoResponse>('coinInfo');
      enableTokens = data.filter((o) => o.trading).map((o) => o.coin);
    }

    return symbols.filter((symbol) =>
      enableTokens.some((token) => token === symbol)
    );
  }

  async getUSDTPrices() {
    const symbols = tokenPrice.getSymbols();
    const tokens = await this.filterToken(symbols);

    if (!tokens.length) {
      return;
    }
    const usdtSymbols = tokenPrice.getUSDTSymbols(tokens);
    const result = await this.invoke<TickerPriceResponse>('tickerPrice', [
      undefined,
      usdtSymbols,
    ]);

    tokenPrice.update(result);
  }
}
