import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import { ReactNode } from 'react';
import { Modal } from '../Modal/Modal';
import styles from './index.module.less';

interface Props {
  title?: ReactNode;
  content?: ReactNode;
  open?: boolean;
  onClose?: () => void;
}
export const AlertModal = (props: Props) => {
  const { title, content, open, onClose } = props;
  return (
    <Modal
      width={490}
      className={styles.alertModal}
      centered
      open={open}
      onCancel={onClose}
    >
      <div className={styles.alertModalTitle}>{title}</div>
      <div className={styles.alertModalContent}>{content}</div>
      <footer className={styles.alertModalFooter}>
        <Button
          type="primary"
          className={styles.alertModalBtn}
          onClick={onClose}
        >
          OK
        </Button>
      </footer>
    </Modal>
  );
};

export const IPFSAddFailedModal = () => {
  const { svVisible, closeSubview } = useZPopupViewState(
    'ipfs-add-failed-modal'
  );
  return (
    <AlertModal
      open={svVisible}
      onClose={closeSubview}
      title="IPFS CID verification failed"
      content="The IPFS-CID of the locally downloaded file is different from the input, indicating a security risk. It is not allowed to be added as a Dapp"
    />
  );
};

export const IPFSNoLodalModal = () => {
  const { svVisible, closeSubview } = useZPopupViewState('ipfs-no-local-modal');
  return (
    <AlertModal
      open={svVisible}
      onClose={closeSubview}
      title="Failed to open the Dapp"
      content="The IPFS-CID of the locally downloaded file is different from the input, indicating a security risk. It is not allowed to be added as a Dapp"
    />
  );
};

export const IPFSVerifyFailedModal = () => {
  const { svVisible, closeSubview } = useZPopupViewState(
    'ipfs-verify-failed-modal'
  );
  return (
    <AlertModal
      open={svVisible}
      onClose={closeSubview}
      title="IPFS CID verification failed"
      content="The IPFS-CID value of the locally downloaded file is different from the IPFS-CID value when the file is added, causing security risks. The current Dapp cannot be opened."
    />
  );
};
