import React from 'react';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { Props as ModalProps } from '../Modal/Modal';
import { CommonHDManagerModal } from './CommonHDManagerModal';

export interface Props extends ModalProps {
  keyringType: string;
  showEntryButton?: boolean;
  brand?: WALLET_BRAND_TYPES;
}

export const HDManagerModal: React.FC<Props> = ({
  keyringType,
  showEntryButton,
  onCancel,
  ...props
}) => {
  const handleClose = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <CommonHDManagerModal
      {...props}
      centered
      className="HDManagerModal"
      width={1280}
      onCancel={handleClose}
      keyring={keyringType}
      keyringId={null}
      showEntryButton={showEntryButton}
    />
  );
};
