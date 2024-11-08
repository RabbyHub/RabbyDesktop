import { SafeMessage } from '@safe-global/api-kit';
import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { walletController } from '../ipcRequest/rabbyx';

export const useGnosisPendingMessages = (
  params: { address?: string },
  options?: Options<
    | {
        total: number;
        results: {
          networkId: string;
          messages: SafeMessage[];
        }[];
      }
    | undefined
    | null,
    any[]
  >
) => {
  const { address } = params;
  return useRequest(
    async () => {
      if (address) {
        return walletController.getGnosisAllPendingMessages(address);
      }
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisPendingMessages-${address}`,
      staleTime: 500,
      ...options,
    }
  );
};
