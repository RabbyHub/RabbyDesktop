import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { sum } from 'lodash';
import { walletController } from '../ipcRequest/rabbyx';

export const useGnosisPendingCount = (
  params: { address?: string },
  options?: Options<number | undefined | null, any[]>
) => {
  const { address } = params;
  return useRequest(
    async () => {
      if (address) {
        const res = await Promise.all([
          walletController.getGnosisAllPendingTxs(address),
          walletController.getGnosisAllPendingMessages(address),
        ]);
        return sum(res.map((item) => item?.total || 0));
      }
      return undefined;
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisPendingTxs-${address}`,
      staleTime: 500,
      ...options,
    }
  );
};
