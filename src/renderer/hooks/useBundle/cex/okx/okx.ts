import type { OkxClient } from '@/main/streams/cex/sdk/okx/client';
import BigNumber from 'bignumber.js';
import { ERROR } from '../../error';
import { bigNumberSum, valueGreaterThanThreshold } from '../../util';
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
  StakingDeFiResponse,
  SavingsResponse,
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
      // 赚币
      this.stakingDeFi(),
      // 余币宝
      this.savings(),
    ]);
    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();
    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
      marginAsset: this.calcMarginAsset(assets[1]),
      financeAsset: this.calcFinanceAsset(assets[2], assets[3]),
    };
    // valueGreaterThanThreshold
    const totalBalance = this.getTotalBalance();

    result.fundingAsset = result.fundingAsset.filter((asset) => {
      return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
    });

    result.marginAsset = result.marginAsset
      ? {
          ...result.marginAsset,
          supplies: result.marginAsset.supplies.filter((asset) => {
            return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
          }),
        }
      : result.marginAsset;
    result.financeAsset = result.financeAsset.filter((asset) => {
      return valueGreaterThanThreshold(asset.usdtValue, totalBalance);
    });
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

  private calcFinanceAsset(
    stakings: StakingDeFiResponse | undefined,
    savings: SavingsResponse | undefined
  ): Asset[] {
    const tokenMap: Record<string, Asset> = {};
    if (stakings) {
      stakings.forEach((item) => {
        item.investData.filter(filterAsset).forEach((asset) => {
          const usdtValue = tokenPrice.getUSDTValue(asset.ccy, asset.amt);
          if (tokenMap[asset.ccy]) {
            const i = tokenMap[asset.ccy];
            tokenMap[asset.ccy].value = bigNumberSum(i.value, asset.amt);
            tokenMap[asset.ccy].usdtValue = bigNumberSum(
              i.usdtValue,
              usdtValue
            );
          } else {
            tokenMap[asset.ccy] = {
              asset: asset.ccy,
              value: asset.amt,
              usdtValue,
            };
          }
          this.plusBalance(usdtValue);
        });

        item.earningData.forEach((asset) => {
          const usdtValue = tokenPrice.getUSDTValue(asset.ccy, asset.earnings);
          if (tokenMap[asset.ccy]) {
            const i = tokenMap[asset.ccy];
            tokenMap[asset.ccy].value = bigNumberSum(i.value, asset.earnings);
            tokenMap[asset.ccy].usdtValue = bigNumberSum(
              i.usdtValue,
              usdtValue
            );
          } else {
            tokenMap[asset.ccy] = {
              asset: asset.ccy,
              value: asset.earnings,
              usdtValue,
            };
          }
          this.plusBalance(usdtValue);
        });
      });
    }
    if (savings) {
      savings.forEach((item) => {
        const asset = item.ccy;
        const value = item.amt;
        const tokenUSDTValue = tokenPrice.getUSDTValue(asset, value);
        const rewardUSDTValue = tokenPrice.getUSDTValue(asset, item.earning);
        const usdtValue = bigNumberSum(tokenUSDTValue, rewardUSDTValue);

        this.plusBalance(usdtValue);
        if (tokenMap[asset]) {
          const i = tokenMap[asset];
          tokenMap[asset].value = bigNumberSum(i.value, value, item.earning);
          tokenMap[asset].usdtValue = bigNumberSum(i.usdtValue, usdtValue);
        } else {
          tokenMap[asset] = {
            asset,
            value: bigNumberSum(value, item.earning),
            usdtValue,
          };
        }
      });
    }
    return Object.values(tokenMap);
  }

  private calcFundingAsset(res: AssetBalancesResponse): FundingAsset {
    return res.filter(filterAsset).map((item) => {
      const asset = item.ccy;
      const value = bigNumberSum(item.bal);
      const usdtValue = tokenPrice.getUSDTValue(asset, value);

      this.plusBalance(usdtValue);

      return {
        asset,
        value,
        usdtValue,
      };
    });
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
      const eq = new BigNumber(item.eq);
      const crossLiabBN = new BigNumber(item.crossLiab);
      if (eq.gt(0)) {
        const usdtValue = tokenPrice.getUSDTValue(asset, item.eq);
        supplies.push({
          asset,
          value: item.eq,
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
        this.subBalance(usdtValue);
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

  private async savings() {
    const res = await this.invoke<SavingsResponse | undefined>('getSavings');

    res?.forEach(({ ccy }) => tokenPrice.addSymbol(ccy));

    return res ?? [];
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
