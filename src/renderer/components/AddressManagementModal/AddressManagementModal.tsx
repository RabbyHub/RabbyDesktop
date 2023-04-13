import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { MainContainer } from './MainContainer';
import { Modal } from '../Modal/Modal';

export const AddressManagementModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('address-management');

  return (
    <Modal
      width={440}
      onCancel={closeSubview}
      open={svVisible}
      title={null}
      smallTitle
      mask={false}
      closable={false}
      style={{
        right: 10,
        // --mainwin-headerblock-offset
        top: 64,
        position: 'absolute',
      }}
      bodyStyle={{
        background: '#353945',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0px 10px 30px rgba(19, 20, 26, 0.2)',
        borderRadius: 12,
      }}
    >
      <MainContainer />
    </Modal>
  );
};
