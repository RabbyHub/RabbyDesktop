import React from 'react';
import {
  useZPopupLayerOnMain,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { Modal } from '../Modal/Modal';
import { SelectModalContent } from './SelectModalContent';

export const SelectAddAddressTypeModalInSubview: React.FC = () => {
  const { showZSubview } = useZPopupLayerOnMain();
  const [keyringType, setKeyringType] = React.useState<string>();
  const [brand, setBrand] = React.useState<WALLET_BRAND_TYPES>();
  const { svVisible, svState, closeSubview } = useZPopupViewState(
    'select-add-address-type-modal'
  );

  React.useEffect(() => {
    if (keyringType) {
      showZSubview('add-address-modal', {
        keyringType,
        brand,
        showEntryButton: !!svState?.showEntryButton,
        showBackButton: true,
      });
      setKeyringType(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyringType]);

  if (!svVisible) return null;

  return (
    <Modal
      centered
      open={svVisible}
      title="Add an Address"
      destroyOnClose
      onCancel={closeSubview}
      footer={null}
    >
      <SelectModalContent
        onSelectType={(type, _brand) => {
          setKeyringType(type);
          setBrand(_brand);
        }}
      />
    </Modal>
  );
};
