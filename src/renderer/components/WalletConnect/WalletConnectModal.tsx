import React from 'react';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { WalletConnectModalContent } from './WalletConnectModalContent';

interface Props extends ModalProps {
  onSuccess: () => void;
}

export const WalletConnectModal: React.FC<Props> = ({
  onSuccess,
  ...props
}) => {
  return (
    <Modal {...props}>
      <WalletConnectModalContent onSuccess={onSuccess} />
    </Modal>
  );
};
