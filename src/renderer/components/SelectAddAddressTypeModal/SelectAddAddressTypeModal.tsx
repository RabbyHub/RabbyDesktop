import React from 'react';
import { Modal } from '../Modal/Modal';
import { SelectModalContent } from './SelectModalContent';
import { AddAddressModalInner } from './AddAddressModalInner';

interface Props {
  visible: boolean;
  onClose: () => void;
  showEntryButton?: boolean;
}

/**
 * @deprecated
 */
export const SelectAddAddressTypeModal: React.FC<Props> = ({
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

  return (
    <>
      <AddAddressModalInner
        keyringType={keyringType}
        onBack={() => setKeyringType(undefined)}
        onCancel={handleCancel}
        visible={visible}
        showEntryButton={showEntryButton}
      />
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
    </>
  );
};
