import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import React from 'react';

// When ledger is selected, we need to connect it first
// due to the requestDevice() ONLY works in user gesture
export function useConnectLedger() {
  const isLedger = HARDWARE_KEYRING_TYPES.Ledger.type;
  const walletController = useShellWallet();

  const connectLedger = React.useCallback(
    async (key: string) => {
      if (key === isLedger) {
        return walletController.connectHardware({
          type: isLedger,
          isWebHID: true,
        });
      }
    },
    [isLedger, walletController]
  );

  return connectLedger;
}
