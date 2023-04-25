import React from 'react';
import {
  useZPopupLayerOnMain,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { AddAddressModalInner } from '../SelectAddAddressTypeModal/AddAddressModalInner';

export const AddAddressModal: React.FC = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('add-address-modal');
  const { showZSubview } = useZPopupLayerOnMain();

  const onCancle = () => {
    closeSubview();
    showZSubview('select-add-address-type-modal');
  };

  if (!svVisible) return null;

  return (
    <AddAddressModalInner
      keyringType={svState?.keyringType ?? undefined}
      onCancel={onCancle}
      visible={svVisible}
      showEntryButton={!!svState?.showEntryButton}
      showBackButton={!!svState?.showBackButton}
      onBack={closeSubview}
    />
  );
};
