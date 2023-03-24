import { Modal } from '@/renderer/components/Modal/Modal';
import { useClearPendingTx } from '@/renderer/hooks/rabbyx/useTransaction';
import { Button } from 'antd';
import style from './index.module.less';

interface ClearPendingModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const ClearPendingModal = ({
  open,
  onClose,
}: ClearPendingModalProps) => {
  const clearPendingTx = useClearPendingTx();

  const handleConfirm = async () => {
    clearPendingTx();
    onClose?.();
  };
  return (
    <Modal
      className={style.modal}
      open={open}
      onCancel={onClose}
      centered
      width={560}
      footer={null}
    >
      <header className={style.modalHeader}>
        <div className={style.modalTitle}>Clear Pending</div>
      </header>
      <div className={style.modalContent}>
        This will clear all your pending transactions. This can help you solve
        the problem that in some cases the state of the transaction in Rabby
        does not match the state on-chain.
        <br />
        <br />
        This will not change the balances in your accounts or require you to
        re-enter your seed phrase. All your assets and accounts information will
        remain secure.
      </div>
      <footer className={style.modalFooter}>
        <Button
          type="primary"
          className={style.modalBtn}
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </footer>
    </Modal>
  );
};
