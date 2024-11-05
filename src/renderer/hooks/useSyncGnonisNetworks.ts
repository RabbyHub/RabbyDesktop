import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { walletController } from '../ipcRequest/rabbyx';

export const useSyncGnosisNetworks = (
  params: { address?: string },
  options?: Options<any, any[]>
) => {
  const { address } = params;
  return useRequest(
    async () => {
      if (address) {
        return walletController.syncGnosisNetworks(address);
      }
    },
    {
      refreshDeps: [address],
      cacheKey: `useSyncGnosisNetworks-${address}`,
      staleTime: 5 * 60 * 1000,
      ...options,
    }
  );
};
