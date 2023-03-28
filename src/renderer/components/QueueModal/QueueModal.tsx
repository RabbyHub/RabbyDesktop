import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { TxList } from './TxList';

export const QueueModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('safe-queue-modal');

  if (!svVisible) return null;

  return (
    <Modal
      width={1000}
      onCancel={closeSubview}
      open={svVisible}
      centered
      title="Queue"
    >
      <TxList onClose={closeSubview} />
    </Modal>
  );
};