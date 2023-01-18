import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import {
  LedgerHDPathType,
  LedgerHDPathTypeLabel,
} from '@/renderer/utils/ledger';
import React, { useEffect } from 'react';

export const useAccountInfo = (type: string, address: string) => {
  const [account, setAccount] = React.useState<{
    address: string;
    hdPathType: LedgerHDPathType;
    hdPathTypeLabel: string;
    index: number;
  }>();
  const isLedger = type === KEYRING_CLASS.HARDWARE.LEDGER;

  const fetchLedgerAccount = React.useCallback(() => {
    walletController
      .requestKeyring(type, 'getAccountInfo', null, address)
      .then((res) => {
        setAccount({
          ...res,
          hdPathTypeLabel:
            LedgerHDPathTypeLabel[res.hdPathType as LedgerHDPathType],
        });
      });
  }, []);

  const fetchTrezorLikeAccount = React.useCallback(() => {
    walletController
      .requestKeyring(type, 'indexFromAddress', null, address)
      .then((index) => {
        setAccount({
          address,
          index: index + 1,
          hdPathType: LedgerHDPathType.BIP44,
          hdPathTypeLabel: LedgerHDPathTypeLabel.BIP44,
        });
      });
  }, []);

  useEffect(() => {
    if (isLedger) {
      fetchLedgerAccount();
    } else if (
      type === KEYRING_CLASS.HARDWARE.TREZOR ||
      type === KEYRING_CLASS.HARDWARE.ONEKEY
    ) {
      fetchTrezorLikeAccount();
    }
  }, [address]);

  return account;
};
