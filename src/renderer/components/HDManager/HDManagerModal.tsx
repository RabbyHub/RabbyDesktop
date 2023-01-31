import { KEYRING_CLASS } from '@/renderer/utils/constant';
import React from 'react';
import { Props as ModalProps } from '../Modal/Modal';
import { LedgerModal } from './LedgerModal';

export interface Props extends ModalProps {
  keyringType: string;
  showEntryButton?: boolean;
}

export const HDManagerModal: React.FC<Props> = ({ keyringType, ...props }) => {
  if (keyringType === KEYRING_CLASS.HARDWARE.LEDGER) {
    return <LedgerModal {...props} />;
  }

  return null;
};
