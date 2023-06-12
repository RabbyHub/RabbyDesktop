import {
  getHttpsProxyAgentForRuntime,
  getOptionProxyForAxios,
} from '@/main/store/desktopApp';
import { handleIpcMainInvoke } from '@/main/utils/ipcMainEvents';
import { getAppRuntimeProxyConf } from '@/main/utils/stream-helpers';
import { getSystemProxyInfo } from '@/main/utils/systemConfig';
import { OkxClient } from './sdk/okx/client';

handleIpcMainInvoke(
  'okx-sdk',
  async (
    _,
    { apiKey, apiSecret, passphrase, simulated, method, params = [] }
  ) => {
    const appProxyConf = {
      ...(await getAppRuntimeProxyConf()),
      systemProxySettings: (await getSystemProxyInfo(true)).systemProxySettings,
    };

    // in fact, Spot client makes request by nodejs'version axios, so we just need to use proxy/proxyAgent
    const client = new OkxClient(
      {
        apiKey,
        apiSecret,
        passphrase,
        // for test
        simulated: simulated === '1',
      },
      {
        proxy: getOptionProxyForAxios(appProxyConf),
        httpsAgent: getHttpsProxyAgentForRuntime(appProxyConf),
      }
    ) as any;

    try {
      return (await client[method](...params)).data;
    } catch (e: any) {
      if (e?.response?.data?.code === 50111) {
        throw new Error('INVALID_KEY');
      }
      throw e;
    }
  }
);
