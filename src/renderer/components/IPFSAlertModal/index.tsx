import { useZPopupViewState } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Button } from 'antd';
import { ReactNode } from 'react';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import clsx from 'clsx';
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
      content="The IPFS-CID of the locally downloaded file is different from the input, indicating a security risk. It is not allowed to be added as a Dapp."
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
      content="The Dapp local file does not exist. Please try adding it again."
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

export const IPFSNotSupportedModal = () => {
  const { svVisible, delayCloseSubview } = useZPopupViewState(
    'ipfs-not-supported-modal'
  );
  return (
    <Modal
      width={490}
      className={styles.alertModal}
      centered
      open={svVisible}
      onCancel={() => delayCloseSubview(150)}
    >
      <div className={styles.alertModalTitle}>IPFS Dapp is not enabled</div>
      <div className={clsx(styles.alertModalContent, 'text-left')}>
        Please enable IPFS Dapp in settings. Please note that using IPFS may
        interfere with the operation of Trezor and Onekey wallets.
      </div>
      <footer className={styles.alertModalFooter}>
        <Button
          type="primary"
          ghost
          className={styles.alertModalBtn}
          onClick={() => delayCloseSubview(150)}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          className={styles.alertModalBtn}
          onClick={() => {
            delayCloseSubview(150);
            forwardMessageTo('main-window', 'route-navigate', {
              data: {
                pathname: '/mainwin/settings',
                params: {},
              },
            });
          }}
        >
          Go to Settings
        </Button>
      </footer>
    </Modal>
  );
};
