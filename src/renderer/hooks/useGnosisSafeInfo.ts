import Safe from '@rabby-wallet/gnosis-sdk';
import { SafeInfo } from '@rabby-wallet/gnosis-sdk/dist/api';
import { useRequest } from 'ahooks';
import type { Options } from 'ahooks/lib/useRequest/src/types';
import { walletController } from '../ipcRequest/rabbyx';
import { KEYRING_CLASS } from '../utils/constant';
import { crossCompareOwners } from '../components/QueueModal/util';

export const useGnosisSafeInfo = (
  params: { address?: string; networkId?: string },
  options?: Options<SafeInfo | null | undefined, any[]>
) => {
  const { address, networkId } = params;
  return useRequest(
    async () => {
      if (address && networkId) {
        const safeInfo = await Safe.getSafeInfo(address, networkId);
        const owners = await walletController.getGnosisOwners(
          {
            address,
            type: KEYRING_CLASS.GNOSIS,
            brandName: KEYRING_CLASS.GNOSIS,
          },
          address,
          safeInfo.version,
          networkId
        );
        const comparedOwners = crossCompareOwners(safeInfo.owners, owners);
        return {
          ...safeInfo,
          owners: comparedOwners,
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
