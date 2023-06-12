import Axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { Signer } from './signer';

interface Config {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  baseURL?: string;
  simulated?: boolean;
}

export class OkxClient {
  private http: AxiosInstance;

  private signer: Signer;

  private config: Config;

  constructor(options: Config, http?: CreateAxiosDefaults) {
    this.http = Axios.create({
      baseURL: options.baseURL || 'https://www.okx.com',
      ...http,
    });
    this.config = options;
    this.signer = new Signer(options.apiSecret);
  }

  get(path: string, params?: Record<string, string>) {
    const [ts, sign] = this.signer.sign(path, params);
    const headers: Record<string, string> = {
      'OK-ACCESS-KEY': this.config.apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': this.config.passphrase,
    };

    if (this.config.simulated) {
      headers['x-simulated-trading'] = '1';
    }

    return this.http.get(path, {
      headers,
      params,
    });
  }

  async getAccountBalance() {
    return this.get('/api/v5/account/balance');
  }

  async getAccountPositions() {
    return this.get('/api/v5/account/positions');
  }

  async getAssetsBalances() {
    return this.get('/api/v5/asset/balances');
  }

  async getAccountConfig() {
    return this.get('/api/v5/account/config');
  }

  async getIndexTickers() {
    return this.get('/api/v5/market/index-tickers', {
      quoteCcy: 'USDT',
    });
  }

  async getStakingDeFi() {
    return this.get('/api/v5/finance/staking-defi/orders-active');
  }

  async getSavings() {
    return this.get('/api/v5/finance/savings/balance');
  }
}
