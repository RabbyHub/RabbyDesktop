import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { Button, Spin } from 'antd';
import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { HDManager } from './HDManager';
import styles from './HDManagerModal.module.less';

interface Device {
  name: string;
}

const LoadingIcon = (
  <LoadingOutlined style={{ fontSize: 20, color: '#fff' }} spin />
);

export const LedgerModal: React.FC<ModalProps> = (props) => {
  const [connected, setConnected] = React.useState(true);
  const [devices, setDevices] = React.useState<Device[]>([]);

  if (!connected) {
    return (
      <Modal {...props} width={1000} title="Connect Ledger">
        <div className={styles.LedgerModal}>
          {devices?.length ? (
            <div>devices list</div>
          ) : (
            <div className={styles.scan}>
              <Spin indicator={LoadingIcon} />
              <span className={styles.text}>Scanning device</span>
            </div>
          )}
          <div className={styles.tipsContainer}>
            <ol className={styles.tips}>
              <li>Plug your Ledger wallet into your computer</li>
              <li>Unlock Ledger and open the Ethereum app</li>
            </ol>
          </div>
          <Button
            disabled={!connected}
            className={styles.next}
            type="primary"
            onClick={() => setConnected(true)}
          >
            Next
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      {...props}
      style={{
        top: 40,
      }}
      className="HDManagerModal"
      width={1280}
      onCancel={(e) => {
        const { onCancel } = props;
        onCancel?.(e);
        setConnected(false);
      }}
    >
      <HDManager keyring={KEYRING_CLASS.HARDWARE.LEDGER} keyringId={null} />
    </Modal>
  );
};
