import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { TxList } from './TxList';

export const QueueModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('safe-queue-modal');

  return (
    <Modal
      width={976}
      onCancel={closeSubview}
      open={svVisible}
      centered
      title="Queue"
    >
      <TxList />
    </Modal>
  );
};
