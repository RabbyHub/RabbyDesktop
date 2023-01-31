import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { Button } from 'antd';
import React from 'react';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { HDManager } from './HDManager';
import styles from './HDManagerModal.module.less';

interface Device {
  name: string;
}

const ledgerUSBVendorId = 0x2c97;

interface Props extends ModalProps {
  showEntryButton?: boolean;
}

export const LedgerModal: React.FC<Props> = ({ showEntryButton, ...props }) => {
  const [connected, setConnected] = React.useState(false);
  const [devices, setDevices] = React.useState<Device[]>([]);

  const detectDevice = React.useCallback(() => {
    // @ts-ignore
    navigator.hid
      .requestDevice({
        filters: [
          {
            vendorId: ledgerUSBVendorId,
          },
        ],
      })
      .then((res: any) => {
        setDevices(res.map((item: any) => ({ name: item.productName })));
      });
  }, []);

  React.useEffect(() => {
    detectDevice();
  }, []);

  const handleClose = React.useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const { onCancel } = props;
      onCancel?.(e);
      setConnected(false);
    },
    [props]
  );

  if (!connected) {
    return (
      <Modal {...props} centered width={1000} title="Connect Ledger">
        <div className={styles.LedgerModal}>
          {devices?.length ? (
            <div className={styles.devices}>
              <h3 className={styles.title}>Found the following device</h3>
              <div className={styles.list}>
                {devices.map((d) => (
                  <div className={styles.device}>
                    <img
                      className={styles.icon}
                      src="rabby-internal://assets/icons/hd-manager/device.svg"
                    />
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.error}>
              <img
                className={styles.icon}
                src="rabby-internal://assets/icons/hd-manager/warning.svg"
              />
              <span className={styles.text}>Hardware wallet not detected</span>
            </div>
          )}
          <div className={styles.tipsContainer}>
            <ol className={styles.tips}>
              <li>Plug your Ledger wallet into your computer</li>
              <li>Unlock Ledger and open the Ethereum app</li>
            </ol>
          </div>
          <Button
            disabled={!devices.length}
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
      centered
      className="HDManagerModal"
      width={1280}
      backable
      onCancel={handleClose}
    >
      <HDManager
        onCancel={handleClose}
        keyring={KEYRING_CLASS.HARDWARE.LEDGER}
        keyringId={null}
        showEntryButton={showEntryButton}
      />
    </Modal>
  );
};
