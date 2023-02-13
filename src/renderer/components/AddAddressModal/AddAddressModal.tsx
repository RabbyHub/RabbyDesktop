import React from 'react';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { Modal } from '../Modal/Modal';
import { SelectModalContent } from './SelectModalContent';
import { ContactModalContent } from './ContactModalContent';
import { HDManagerModal } from '../HDManager/HDManagerModal';
import { WalletConnectModal } from '../WalletConnect/WalletConnectModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  showEntryButton?: boolean;
}

export const AddAddressModal: React.FC<Props> = ({
  showEntryButton,
  visible,
  onClose,
}) => {
  const [keyringType, setKeyringType] = React.useState<string>();
  const handleCancel = React.useCallback(() => {
    onClose();
    setKeyringType(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (keyringType === KEYRING_CLASS.WATCH) {
    return (
      <Modal
        centered
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

  if (keyringType === KEYRING_CLASS.WALLETCONNECT) {
    return (
      <WalletConnectModal
        centered
        open={visible}
        title="Wallet Connect"
        backable
        onBack={() => setKeyringType(undefined)}
        destroyOnClose
        onCancel={handleCancel}
        footer={null}
        onSuccess={handleCancel}
      />
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
        backable
        onBack={() => {
          setKeyringType(undefined);
        }}
        showEntryButton={showEntryButton}
      />
    );
  }

  return (
    <Modal
      centered
      open={visible}
      title="Add an Address"
      destroyOnClose
      onCancel={onClose}
      footer={null}
    >
      <SelectModalContent onSelectType={setKeyringType} />
    </Modal>
  );
};
