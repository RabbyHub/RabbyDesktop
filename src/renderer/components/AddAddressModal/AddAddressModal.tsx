import React from 'react';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { Modal } from '../Modal/Modal';
import { SelectModalContent } from './SelectModalContent';
import { ContactModalContent } from './ContactModalContent';
import { HDManagerModal } from '../HDManager/HDManagerModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AddAddressModal: React.FC<Props> = ({ visible, onClose }) => {
  const [keyringType, setKeyringType] = React.useState<string>();
  const handleCancel = React.useCallback(() => {
    onClose();
    setKeyringType(undefined);
  }, []);

  if (keyringType === KEYRING_CLASS.WATCH) {
    return (
      <Modal
        open={visible}
        title="Add Contacts"
        subtitle="You can also use it as a watch-only address"
        backable
        onBack={() => setKeyringType(undefined)}
        destroyOnClose
        onCancel={handleCancel}
        footer={null}
      >
        <ContactModalContent onSuccess={onClose} />
      </Modal>
    );
  }

  if (
    keyringType &&
    [
      KEYRING_CLASS.HARDWARE.LEDGER,
      KEYRING_CLASS.HARDWARE.ONEKEY,
      KEYRING_CLASS.HARDWARE.TREZOR,
    ].includes(keyringType)
  ) {
    return (
      <HDManagerModal
        open={visible}
        onCancel={handleCancel}
        destroyOnClose
        keyringType={keyringType}
        footer={null}
      />
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
