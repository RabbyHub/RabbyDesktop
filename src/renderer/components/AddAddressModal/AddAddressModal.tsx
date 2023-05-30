import React from 'react';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { AddAddressModalInner } from '../SelectAddAddressTypeModal/AddAddressModalInner';

export const AddAddressModal: React.FC = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('add-address-modal');

  if (!svVisible) return null;

  return (
    <AddAddressModalInner
      keyringType={svState?.keyringType}
      brand={svState?.brand}
      onCancel={closeSubview}
      visible={svVisible}
      showEntryButton={!!svState?.showEntryButton}
      showBackButton={!!svState?.showBackButton}
      onBack={closeSubview}
    />
  );
};
