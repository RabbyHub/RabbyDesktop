import { handleIpcMainInvoke } from '@/main/utils/ipcMainEvents';
import { Spot } from '@binance/connector';

handleIpcMainInvoke(
  'binance-sdk',
  async (_, { apiKey, apiSecret, method, params = [] }) => {
    const client = new Spot(apiKey, apiSecret);

    return (await client[method](...params)).data;
  }
);
