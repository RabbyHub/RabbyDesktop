import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
// import { WalletController, useWallet } from '../utils';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { walletController } from '../ipcRequest/rabbyx';

export const useGnosisPendingTxs = (
  params: { address?: string },
  options?: Options<
    | {
        total: number;
        results: {
          networkId: string;
          txs: SafeTransactionItem[];
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
        return walletController.getGnosisAllPendingTxs(address);
      }
      return undefined;
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisPendingTxs-${address}`,
      ...options,
    }
  );
};
