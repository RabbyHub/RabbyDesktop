import React from 'react';
import { Modal } from '../Modal/Modal';
import { KEYRING_CLASS } from '../../utils/keyring';
import { SelectModalContent } from './SelectModalContent';
import { ContactModalContent } from './ContactModalContent';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AddAddressModal: React.FC<Props> = ({ visible, onClose }) => {
  const [keyringType, setKeyringType] = React.useState<string>();

  if (keyringType === KEYRING_CLASS.WATCH) {
    return (
      <Modal
        open={visible}
        title="Add Contacts"
        subtitle="You can also use it as a watch-only address"
        backable
        onBack={() => setKeyringType(undefined)}
        destroyOnClose
        onCancel={onClose}
        footer={null}
      >
        <ContactModalContent onSuccess={onClose} />
      </Modal>
    );
  }

  return (
    <Modal
      open={visible}
      title="Add an Address"
      destroyOnClose
      onCancel={onClose}
      footer={null}
    >
      <SelectModalContent onClose={onClose} onSelectType={setKeyringType} />
    </Modal>
  );
};
