import { BasicSafeInfo } from '@rabby-wallet/gnosis-sdk';
import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { crossCompareOwners } from '../components/QueueModal/util';
import { walletController } from '../ipcRequest/rabbyx';
import { KEYRING_CLASS } from '../utils/constant';

export const useGnosisSafeInfo = (
  params: { address?: string; networkId?: string },
  options?: Options<BasicSafeInfo | null | undefined, any[]>
) => {
  const { address, networkId } = params;
  return useRequest(
    async () => {
      if (address && networkId) {
        const safeInfo = await walletController.getBasicSafeInfo({
          address,
          networkId,
        });

        return {
          ...safeInfo,
        };
      }
      return null;
    },
    {
      refreshDeps: [address],
      cacheKey: `useGnosisSafeInfo-${address}-${networkId}`,
      ...options,
    }
  );
};
