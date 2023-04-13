// @ts-expect-error
import { Spot } from '@binance/connector';

import {
  getHttpsProxyAgentForRuntime,
  getOptionProxyForAxios,
} from '@/main/store/desktopApp';
import { handleIpcMainInvoke } from '@/main/utils/ipcMainEvents';
import { getAppRuntimeProxyConf } from '@/main/utils/stream-helpers';

handleIpcMainInvoke(
  'binance-sdk',
  async (_, { apiKey, apiSecret, method, params = [] }) => {
    const runtimeProxyConf = await getAppRuntimeProxyConf();

    // in fact, Spot client makes request by nodejs'version axios, so we just need to use proxy/proxyAgent
    const client = new Spot(apiKey, apiSecret, {
      proxy: getOptionProxyForAxios(runtimeProxyConf),
      httpsAgent: getHttpsProxyAgentForRuntime(runtimeProxyConf),
    });

    return (await client[method](...params)).data;
  }
);
