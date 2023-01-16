import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { Button } from 'antd';
import React from 'react';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { HDManager } from './HDManager';

interface Device {
  name: string;
}

export const LedgerModal: React.FC<ModalProps> = (props) => {
  const [connected, setConnected] = React.useState(false);
  const [devices, setDevices] = React.useState<Device[]>([]);

  if (!connected) {
    return (
      <Modal {...props} width={1000} title="Connect Ledger">
        <div>
          <div>Scanning device</div>
          <ul>
            <li>Plug your Ledger wallet into your computer</li>
            <li>Unlock Ledger and open the Ethereum app</li>
          </ul>
          <Button onClick={() => setConnected(true)}>Next</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      {...props}
      title={213}
      width={1280}
      backable
      onBack={() => setConnected(false)}
    >
      {/* <HDManager keyring={KEYRING_CLASS.HARDWARE.LEDGER} keyringId={null} /> */}
      123
    </Modal>
  );
};
