// @ts-expect-error
import {
  Spot,
  USDFutures,
  TokenFutures,
} from '@rabby-wallet/binance-connector';

import {
  getHttpsProxyAgentForRuntime,
  getOptionProxyForAxios,
} from '@/main/store/desktopApp';
import { handleIpcMainInvoke } from '@/main/utils/ipcMainEvents';
import { getAppRuntimeProxyConf } from '@/main/utils/stream-helpers';
import { getSystemProxyInfo } from '@/main/utils/systemConfig';

handleIpcMainInvoke(
  'binance-sdk',
  async (_, { apiKey, apiSecret, method, params = [] }) => {
    const appProxyConf = {
      ...(await getAppRuntimeProxyConf()),
      systemProxySettings: (await getSystemProxyInfo(true)).systemProxySettings,
    };

    // in fact, Spot client makes request by nodejs'version axios, so we just need to use proxy/proxyAgent
    const client = new Spot(apiKey, apiSecret, {
      proxy: getOptionProxyForAxios(appProxyConf),
      httpsAgent: getHttpsProxyAgentForRuntime(appProxyConf),
    });
    try {
      return (await client[method](...params)).data;
    } catch (e: any) {
      if (e?.response?.data?.code === -2008) {
        throw new Error('INVALID_KEY');
      }
      throw e;
    }
  }
);

handleIpcMainInvoke(
  'binance-usd-futures-sdk',
  async (_, { apiKey, apiSecret, method, params = [] }) => {
    const appProxyConf = {
      ...(await getAppRuntimeProxyConf()),
      systemProxySettings: (await getSystemProxyInfo(true)).systemProxySettings,
    };

    // in fact, Spot client makes request by nodejs'version axios, so we just need to use proxy/proxyAgent
    const client = new USDFutures(apiKey, apiSecret, {
      proxy: getOptionProxyForAxios(appProxyConf),
      httpsAgent: getHttpsProxyAgentForRuntime(appProxyConf),
    });

    try {
      return (await client[method](...params)).data;
    } catch (e: any) {
      if (e?.response?.data?.code === -2008) {
        throw new Error('INVALID_KEY');
      }
      throw e;
    }
  }
);

handleIpcMainInvoke(
  'binance-token-futures-sdk',
  async (_, { apiKey, apiSecret, method, params = [] }) => {
    const appProxyConf = {
      ...(await getAppRuntimeProxyConf()),
      systemProxySettings: (await getSystemProxyInfo(true)).systemProxySettings,
    };

    // in fact, Spot client makes request by nodejs'version axios, so we just need to use proxy/proxyAgent
    const client = new TokenFutures(apiKey, apiSecret, {
      proxy: getOptionProxyForAxios(appProxyConf),
      httpsAgent: getHttpsProxyAgentForRuntime(appProxyConf),
    });

    try {
      return (await client[method](...params)).data;
    } catch (e: any) {
      if (e?.response?.data?.code === -2008) {
        throw new Error('INVALID_KEY');
      }
      throw e;
    }
  }
);
