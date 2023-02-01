import { KEYRING_CLASS } from '@/renderer/utils/constant';
import React from 'react';
import { Props as ModalProps } from '../Modal/Modal';
import { CommonHDManagerModal } from './CommonHDManagerModal';

interface Props extends ModalProps {
  showEntryButton?: boolean;
}

export const LedgerModal: React.FC<Props> = ({ showEntryButton, ...props }) => {
  const handleClose = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const { onCancel } = props;
      onCancel?.(e);
    },
    [props]
  );

  return (
    <CommonHDManagerModal
      {...props}
      centered
      className="HDManagerModal"
      width={1280}
      backable
      onCancel={handleClose}
      keyring={KEYRING_CLASS.HARDWARE.LEDGER}
      keyringId={null}
      showEntryButton={showEntryButton}
    />
  );
};
