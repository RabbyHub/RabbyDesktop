import React from 'react';

export enum LedgerHDPathType {
  LedgerLive = 'LedgerLive',
  Legacy = 'Legacy',
  BIP44 = 'BIP44',
}

export const LedgerHDPathTypeLabel = {
  [LedgerHDPathType.LedgerLive]: 'Ledger Live',
  [LedgerHDPathType.BIP44]: 'BIP44',
  [LedgerHDPathType.Legacy]: 'Legacy',
};

export const ledgerUSBVendorId = 0x2c97;

export const useLedgerDeviceConnected = () => {
  const [connected, setConnected] = React.useState(false);

  const onConnect = async ({ device }: any) => {
    if (device.vendorId === ledgerUSBVendorId) {
      setConnected(true);
    }
  };

  const onDisconnect = ({ device }: any) => {
    if (device.vendorId === ledgerUSBVendorId) {
      setConnected(false);
    }
  };

  const detectDevice = async () => {
    // setConnected(true);
  };

  React.useEffect(() => {
    detectDevice();
    window.navigator.hid.addEventListener('connect', onConnect);
    window.navigator.hid.addEventListener('disconnect', onDisconnect);

    return () => {
      window.navigator.hid.removeEventListener('connect', onConnect);
      window.navigator.hid.removeEventListener('disconnect', onDisconnect);
    };
  }, []);

  return connected;
};
