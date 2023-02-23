import React from 'react';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { SuccessContent } from './SuccessContent';
import { ContactModalContent } from './ContactModalContent';

type Account = import('@/isomorphic/types/rabbyx').Account;

interface Props extends ModalProps {
  onSuccess: () => void;
}

export const ContactModal: React.FC<Props> = ({ onSuccess, ...props }) => {
  const [result, setResult] = React.useState<Account[]>();

  if (result) {
    return (
      <Modal open={props.open} centered smallTitle onCancel={onSuccess}>
        <SuccessContent onSuccess={onSuccess} accounts={result ?? []} />
      </Modal>
    );
  }

  return (
    <Modal {...props}>
      <ContactModalContent onSuccess={setResult} />
    </Modal>
  );
};
