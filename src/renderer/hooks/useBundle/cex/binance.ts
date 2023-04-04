import { isBoolean } from 'lodash';

export class Binance {
  apiKey: string;

  apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async invoke<T>(method: string, params?: any[]): Promise<T> {
    try {
      return await window.rabbyDesktop.ipcRenderer.invoke('binance-sdk', {
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
        method,
        params,
      });
    } catch (e) {
      throw new Error('INVALID_KEY');
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
          throw new Error('PERMISSION_ERROR');
        }
        if (!allowed.includes(key) && value) {
          throw new Error('PERMISSION_ERROR');
        }
      }
    });
  }
}
