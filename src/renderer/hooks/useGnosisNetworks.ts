import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { walletController } from '../ipcRequest/rabbyx';

export const useGnosisNetworks = (
  params: { address?: string },
  options?: Options<string[] | undefined, any[]>
) => {
  const { address } = params;
  return useRequest(
    async () => {
      if (address) {
        return walletController.getGnosisNetworkIds(address);
      }
      return undefined;
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisNetworks-${address}`,
      ...options,
    }
  );
};
