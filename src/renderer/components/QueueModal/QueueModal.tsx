import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisPendingTxs } from '@/renderer/hooks/useGnosisPendingTxs';
import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { Modal } from '../Modal/Modal';
import { TabTxList } from './TabTxList';
import styles from './style.module.less';

export const QueueModal: React.FC = () => {
  const { svVisible, closeSubview } = useZPopupViewState('safe-queue-modal');

  const { currentAccount: account } = useCurrentAccount();
  const { data } = useGnosisPendingTxs({ address: account?.address });

  if (!svVisible) return null;

  return (
    <Modal
      width={1000}
      onCancel={closeSubview}
      open={svVisible}
      centered
      className={styles.modal}
      title={`Queue(${data?.total || 0})`}
    >
      <TabTxList onClose={closeSubview} />
    </Modal>
  );
};
