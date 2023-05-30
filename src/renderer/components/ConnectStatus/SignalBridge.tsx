import { KEYRING_CLASS } from '@/renderer/utils/constant';
import React from 'react';
import { SessionSignal } from '../WalletConnect/SessionSignal';
import { GridPlusSignal } from './GridPlusSignal';
import { LedgerSignal } from './LedgerSignal';

export interface Props {
  type: string;
  address: string;
  brandName: string;
  className?: string;
}

export const SignalBridge: React.FC<Props> = ({
  type,
  address,
  brandName,
  className,
}) => {
  return (
    <>
      {type === KEYRING_CLASS.WALLETCONNECT && (
        <SessionSignal
          isBadge
          address={address}
          brandName={brandName}
          pendingConnect
          className={className}
        />
      )}
      {type === KEYRING_CLASS.HARDWARE.LEDGER && (
        <LedgerSignal isBadge className={className} />
      )}
      {type === KEYRING_CLASS.HARDWARE.GRIDPLUS && (
        <GridPlusSignal isBadge className={className} />
      )}
    </>
  );
};
