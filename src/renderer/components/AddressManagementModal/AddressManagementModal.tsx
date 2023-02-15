import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { MainContainer } from './MainContainer';
import { Modal } from '../Modal/Modal';

export const AddressManagementModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('address-management');

  return (
    <Modal
      width={520}
      onCancel={closeSubview}
      open={svVisible}
      title="Current Address"
      smallTitle
    >
      <MainContainer />
    </Modal>
  );
};
