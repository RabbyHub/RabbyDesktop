import { useEffect } from 'react';
import { walletController } from '../ipcRequest/rabbyx';

export const useSyncGnosisNetworks = (address?: string) => {
  useEffect(() => {
    if (address) {
      walletController.syncGnosisNetworks(address);
    }
  }, [address]);
};
