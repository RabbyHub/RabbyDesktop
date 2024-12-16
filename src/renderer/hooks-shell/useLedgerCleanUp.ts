import React from 'react';
import { walletController } from '../ipcRequest/rabbyx';
import { KEYRING_CLASS } from '../utils/constant';
import { ledgerUSBVendorId } from '../utils/ledger';
import { useHIDDevices } from '../hooks/useDevices';

export const useLedgerCleanUp = () => {
  const { devices } = useHIDDevices();

  React.useEffect(() => {
    const hasLedger = devices.some(
      (item) => item.vendorId === ledgerUSBVendorId
    );
    if (!hasLedger) {
      walletController.requestKeyring(
        KEYRING_CLASS.HARDWARE.LEDGER,
        'cleanUp',
        null
      );
    }
  }, [devices]);
};
