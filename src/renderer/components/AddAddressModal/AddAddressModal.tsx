import React from 'react';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { AddAddressModalInner } from '../SelectAddAddressTypeModal/AddAddressModalInner';

export const AddAddressModal: React.FC = () => {
  const { svVisible, svState, closeSubview } =
    useZPopupViewState('add-address-modal');

  const handleCancel = React.useCallback(() => {
    closeSubview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AddAddressModalInner
      keyringType={svState?.keyringType ?? undefined}
      onCancel={handleCancel}
      visible={svVisible}
    />
  );
};
