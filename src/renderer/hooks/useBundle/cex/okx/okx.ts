import { OkxClient } from '@/main/streams/cex/sdk/okx/client';
import BigNumber from 'bignumber.js';
import { ERROR } from '../../error';
import { bigNumberSum, valueGreaterThan10 } from '../../util';
import { Cex } from '../utils/cex';
import { TokenPrice } from '../utils/price';
import {
  MarginAsset,
  AccountBalanceResponse,
  AssetBalancesResponse,
  FundingAsset,
  IndexTickersResponse,
  PermissionResponse,
  Asset,
  AccountPositionResponse,
  StakingDeFiResponse,
  SavingsResponse,
  IsolatedMarginAsset,
  StakingAsset,
  SavingsAsset,
} from './type';

export const tokenPrice = new TokenPrice();

// 不在该数组中的资产，不应被统计
let enableTokens: string[] = [];
const filterAsset = (data: { ccy: string }) => {
  return enableTokens.includes(data.ccy);
};

interface OkxConfig {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  simulated?: string;
}
export class OKX extends Cex<OkxConfig> {
  static cexName = 'OKX';

  constructor({
    apiKey,
    apiSecret,
    passphrase,
    simulated,
    enableInvalidKeyModal = true,
    nickname,
  }: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
    simulated?: string;
    enableInvalidKeyModal?: boolean;
    nickname?: string;
  }) {
    super();
    this.config = {
      apiKey,
      apiSecret,
      passphrase,
      simulated,
    };
    this.enableInvalidKeyModal = enableInvalidKeyModal;
    this.nickname = nickname;
  }

  async invoke<T>(method: keyof OkxClient, params?: any[]): Promise<T> {
    try {
      const res = await window.rabbyDesktop.ipcRenderer.invoke('okx-sdk', {
        apiKey: this.config.apiKey,
        apiSecret: this.config.apiSecret,
        passphrase: this.config.passphrase,
        simulated: this.config.simulated,
        method,
        params,
      });

      return res.data;
    } catch (e: any) {
      if (e.message.includes(ERROR.INVALID_KEY)) {
        this.showInvalidKeyModal(this.config.apiKey);
      }
      // 未知错误
      throw new Error(ERROR.UNKNOWN);
    }
  }

  async getAssets() {
    this.resetBalance();

    // 获取所有资产
    const assets = await Promise.all([
      // 资金账户
      this.fundingWallet(),
      // 交易账户
      this.accountAsset(),
      // 持仓
      this.accountPositions(),
      // 赚币
      this.stakingDeFi(),
      // 余币宝
      this.savings(),
    ]);

    console.log('okx', assets);

    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();

    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
      marginAsset: this.calcMarginAsset(assets[1]),
      isolatedMarginAsset: this.calcIsolatedMarginAsset(assets[2]),
      stakingAsset: this.calcStake(assets[3], 'staking'),
      defiAsset: this.calcStake(assets[3], 'defi'),
      savingsAsset: this.calcSavings(assets[4]),
    };

    return result;
  }

  async checkPermission() {
    const res = await this.invoke<PermissionResponse>('getAccountConfig');
    const allowed = 'read_only';

    if (res.perm !== allowed) {
      throw new Error(ERROR.PERMISSION_ERROR);
    }
  }

  private async fundingWallet() {
    const res = await this.invoke<AssetBalancesResponse | undefined>(
      'getAssetsBalances'
    );

    res?.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));

    return res ?? [];
  }

  private calcFundingAsset(res: AssetBalancesResponse): FundingAsset {
    return res
      .filter(filterAsset)
      .map((item) => {
        const asset = item.ccy;
        const value = bigNumberSum(item.bal);
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

  private async accountAsset() {
    const res = await this.invoke<AccountBalanceResponse | undefined>(
      'getAccountBalance'
    );

    res?.forEach(({ details }) => {
      details.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));
    });

    return res ?? [];
  }

  private calcMarginAsset(
    res: AccountBalanceResponse
  ): MarginAsset | undefined {
    const supplies: Asset[] = [];
    const borrows: Asset[] = [];
    const result = res[0];

    result.details.filter(filterAsset).forEach((item) => {
      const asset = item.ccy;
      const availEqBN = new BigNumber(item.availEq);
      const crossLiabBN = new BigNumber(item.crossLiab);

      if (availEqBN.gt(0)) {
        const usdtValue = tokenPrice.getUSDTValue(asset, item.availEq);
        supplies.push({
          asset,
          value: item.availEq,
          usdtValue,
        });

        this.plusBalance(usdtValue);
      }

      if (crossLiabBN.gt(0)) {
        const usdtValue = tokenPrice.getUSDTValue(asset, item.crossLiab);
        borrows.push({
          asset,
          value: item.crossLiab,
          usdtValue,
        });

        this.plusBalance(`-${usdtValue}`);
      }
    });

    if (!supplies.length && !borrows.length) {
      return undefined;
    }

    return {
      supplies,
      borrows,
      healthRate: result.mgnRatio,
    };
  }

  private async accountPositions() {
    const res = await this.invoke<AccountPositionResponse | undefined>(
      'getAccountPositions'
    );

    res?.forEach(({ posCcy, liabCcy }) => {
      tokenPrice.addSymbol(posCcy);
      tokenPrice.addSymbol(liabCcy);
    });

    return res ?? [];
  }

  private calcIsolatedMarginAsset(
    res: AccountPositionResponse
  ): IsolatedMarginAsset {
    return res
      .filter((item) => {
        const assets = [item.posCcy, item.liabCcy];
        return (
          item.instType === 'MARGIN' &&
          item.mgnMode === 'isolated' &&
          assets.every((asset) => filterAsset({ ccy: asset }))
        );
      })
      .map((item) => {
        const supplies: Asset[] = [];
        const borrows: Asset[] = [];
        const supplyUsdtValue = tokenPrice.getUSDTValue(item.posCcy, item.pos);

        supplies.push({
          asset: item.posCcy,
          value: item.pos,
          usdtValue: supplyUsdtValue,
        });

        this.plusBalance(supplyUsdtValue);

        const liabAbs = new BigNumber(item.liab).abs().toString();
        const borrowUsdtValue = tokenPrice.getUSDTValue(item.liabCcy, liabAbs);
        borrows.push({
          asset: item.liabCcy,
          value: liabAbs,
          usdtValue: borrowUsdtValue,
        });

        return {
          supplies,
          borrows,
          healthRate: item.mgnRatio,
        };
      });
  }

  private async stakingDeFi() {
    const res = await this.invoke<StakingDeFiResponse | undefined>(
      'getStakingDeFi'
    );

    res?.forEach(({ investData, earningData }) => {
      investData.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));
      earningData.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));
    });

    return res ?? [];
  }

  private calcStake(
    res: StakingDeFiResponse,
    type: StakingDeFiResponse[0]['protocolType']
  ): StakingAsset {
    return res
      .filter((item) => item.protocolType === type)
      .map((item) => {
        const assets: Asset[] = [];
        const rewards: Asset[] = [];

        item.investData.filter(filterAsset).forEach((asset) => {
          const usdtValue = tokenPrice.getUSDTValue(asset.ccy, asset.amt);
          assets.push({
            asset: asset.ccy,
            value: asset.amt,
            usdtValue,
          });
          this.plusBalance(usdtValue);
        });

        item.earningData.forEach((asset) => {
          const usdtValue = tokenPrice.getUSDTValue(asset.ccy, asset.earnings);
          rewards.push({
            asset: asset.ccy,
            value: asset.earnings,
            usdtValue,
          });
          this.plusBalance(usdtValue);
        });

        return {
          assets,
          rewards,
          usdtValue: bigNumberSum(
            ...assets.map((o) => o.usdtValue),
            ...rewards.map((o) => o.usdtValue)
          ),
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  private async savings() {
    const res = await this.invoke<SavingsResponse | undefined>('getSavings');

    res?.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));

    return res ?? [];
  }

  private calcSavings(res: SavingsResponse): SavingsAsset {
    return res
      .filter(filterAsset)
      .map((item) => {
        const asset = item.ccy;
        const value = item.amt;
        const tokenUSDTValue = tokenPrice.getUSDTValue(asset, value);
        const rewardUSDTValue = tokenPrice.getUSDTValue(asset, item.earning);
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
              value: item.earning,
              usdtValue: rewardUSDTValue,
            },
          ],
          usdtValue,
        };
      })
      .filter((item) => valueGreaterThan10(item.usdtValue));
  }

  async getUSDTPrices() {
    const result = await this.invoke<IndexTickersResponse>('getIndexTickers');
    const prices = result.map((item) => {
      const symbol = item.instId.replace('-', '');
      const price = item.idxPx;

      return {
        symbol,
        price,
      };
    });

    enableTokens = prices.map((o) => o.symbol.replace('USDT', ''));
    enableTokens.push('USDT');

    tokenPrice.update(prices);
  }
}
