import { OkxClient } from '@/main/streams/cex/sdk/okx/client';
import { ERROR } from '../../error';
import { bigNumberSum, valueGreaterThan10 } from '../../util';
import { Cex } from '../utils/cex';
import { TokenPrice } from '../utils/price';
import {
  AssetBalancesResponse,
  FundingAsset,
  IndexTickersResponse,
  PermissionResponse,
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
}
export class OKX extends Cex<OkxConfig> {
  cexName = 'OKX';

  constructor({
    apiKey,
    apiSecret,
    passphrase,
    enableInvalidKeyModal = true,
    nickname,
  }: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
    enableInvalidKeyModal?: boolean;
    nickname?: string;
  }) {
    super();
    this.config = {
      apiKey,
      apiSecret,
      passphrase,
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
    const assets = await Promise.all([this.fundingWallet()]);

    console.log('okx', assets);

    // 获取所有 token 对应的 usdt 价值
    await this.getUSDTPrices();

    // 汇总
    const result = {
      fundingAsset: this.calcFundingAsset(assets[0]),
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

    enableTokens = prices.map((o) => o.symbol);
    tokenPrice.update(prices);
  }
}
