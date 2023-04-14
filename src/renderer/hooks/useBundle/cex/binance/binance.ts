import { isBoolean } from 'lodash';
import BigNumber from 'bignumber.js';
import { ModalConfirm } from '@/renderer/components/Modal/Confirm';
import { ellipsis } from '@/renderer/utils/address';
import { ERROR } from '../../error';
import { tokenPrice } from './price';
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
} from './type';
import { valueGreaterThan10, bigNumberSum } from '../../util';

// 不在该数组中的资产，不应被统计
let enableTokens: string[] = [];
const filterAsset = (data: { asset: string }) => {
  return enableTokens.includes(data.asset);
};

export class Binance {
  apiKey: string;

  apiSecret: string;

  enableInvalidKeyModal = true;

  nickname?: string;

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
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.enableInvalidKeyModal = enableInvalidKeyModal;
    this.nickname = nickname;
  }

  private visibleInvalidKeyModal = false;

  private async invoke<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke('binance-sdk', {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
        method,
        params,
      });
    } catch (e: any) {
      if (e.message.includes(ERROR.INVALID_KEY)) {
        if (!this.visibleInvalidKeyModal && this.enableInvalidKeyModal) {
          this.visibleInvalidKeyModal = true;
          ModalConfirm({
            title: 'Binance API has become invalid',
            content: `${this.nickname} (${ellipsis(
              this.apiKey
            )}) API has become invalid. It will be removed from Bundle Address.`,
            height: 220,
            okCancel: false,
          });
        }
        throw new Error(ERROR.INVALID_KEY);
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
      this.stakingProductPosition('F_DEFI'),
      this.stakingProductPosition('L_DEFI'),
      this.bswapLiquidity(),
    ]);

    console.log('binance', assets);

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
    };

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
      const usdtValue = bigNumberSum(
        ...assets.map((o) => o.usdtValue),
        ...rewards.map((o) => o.usdtValue)
      );

      return {
        assets,
        rewards,
        usdtValue,
      };
    });
  }

  private async fundingWallet() {
    const res = await this.invoke<FundingWalletResponse>('fundingWallet');

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcFundingAsset(res: FundingWalletResponse): FundingAsset {
    return res
      .filter(filterAsset)
      .map((item) => {
        const asset = item.asset;
        const value = bigNumberSum(item.free, item.locked, item.freeze);
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
      .filter(filterAsset)
      .map((item) => {
        const asset = item.asset;
        const value = bigNumberSum(item.free, item.locked, item.freeze);
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
    const res = await this.invoke<MarginAccountResponse>('marginAccount', []);
    const checkValues = [
      'borrowed',
      'free',
      'interest',
      'locked',
      'netAsset',
    ] as const;
    const userAssets: MarginAccountResponse['userAssets'] = [];

    res.userAssets.forEach((item) => {
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
        supplies.push({
          asset: item.asset,
          value: item.netAsset,
          usdtValue: tokenPrice.getUSDTValue(item.asset, item.netAsset),
        });
      } else {
        const absValue = netAssetBN.abs().toString();
        borrows.push({
          asset: item.asset,
          value: absValue,
          usdtValue: tokenPrice.getUSDTValue(item.asset, absValue),
        });
      }

      this.plusBalance(item.netAsset);
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

    res.assets.forEach((item) => {
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
          supplies.push({
            asset: o.asset,
            value: o.netAsset,
            usdtValue: tokenPrice.getUSDTValue(o.asset, o.netAsset),
          });

          this.plusBalance(o.netAsset);
        }
        if (borrowedBN.gt(0)) {
          borrows.push({
            asset: o.asset,
            value: o.borrowed,
            usdtValue: tokenPrice.getUSDTValue(o.asset, o.borrowed),
          });

          this.plusBalance(o.borrowed);
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
      .filter(filterAsset)
      .map((item) => {
        const asset = item.asset;
        const value = new BigNumber(item.totalAmount)
          .minus(item.totalInterest)
          .toString();
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
          rewards: [
            {
              asset,
              value: item.totalInterest,
              usdtValue: rewardUSDTValue,
            },
          ],
          usdtValue,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async savingsCustomizedPosition() {
    const res = await this.invoke<SavingsCustomizedPositionResponse>(
      'savingsCustomizedPosition'
    );

    res.forEach(({ asset }) => tokenPrice.addSymbol(asset));

    return res;
  }

  private calcFixed(
    res: SavingsCustomizedPositionResponse
  ): AssetWithRewards[] {
    return res
      .filter(filterAsset)
      .map((item) => {
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
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async stakingProductPosition(type: string) {
    const res = await this.invoke<StakingProductPositionResponse>(
      'stakingProductPosition',
      [
        type,
        {
          size: 100,
        },
      ]
    );

    res.forEach(({ asset, rewardAsset, extraRewardAsset }) => {
      tokenPrice.addSymbol(asset);
      tokenPrice.addSymbol(rewardAsset);
      tokenPrice.addSymbol(extraRewardAsset);
    });

    return res;
  }

  private calcStake(res: StakingProductPositionResponse): AssetWithRewards[] {
    return res
      .filter(filterAsset)
      .map((item) => {
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
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
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

  private async getUSDTPrices() {
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
