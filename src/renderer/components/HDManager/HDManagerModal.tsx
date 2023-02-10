import React from 'react';
import { Props as ModalProps } from '../Modal/Modal';
import { CommonHDManagerModal } from './CommonHDManagerModal';

export interface Props extends ModalProps {
  keyringType: string;
  showEntryButton?: boolean;
}

export const HDManagerModal: React.FC<Props> = ({
  keyringType,
  showEntryButton,
  ...props
}) => {
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
      keyring={keyringType}
      keyringId={null}
      showEntryButton={showEntryButton}
    />
  );
};
