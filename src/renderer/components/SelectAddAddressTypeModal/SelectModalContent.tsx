import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import clsx from 'clsx';
import React from 'react';
import { ContactTypeCard } from './ContactCard';
import styles from './index.module.less';

const HARDWARE_MAP = [
  {
    logo: 'rabby-internal://assets/icons/device/ledger.svg',
    name: 'Ledger',
    id: KEYRING_CLASS.HARDWARE.LEDGER,
  },
  {
    logo: 'rabby-internal://assets/icons/device/trezor.svg',
    name: 'Trezor',
    id: KEYRING_CLASS.HARDWARE.TREZOR,
  },
  {
    logo: 'rabby-internal://assets/icons/device/onekey.svg',
    name: 'OneKey',
    id: KEYRING_CLASS.HARDWARE.ONEKEY,
  },
];

interface Props {
  onSelectType: (type: string) => void;
}

export const SelectModalContent: React.FC<Props> = ({ onSelectType }) => {
  return (
    <div className={styles.SelectModalContent}>
      <div className={clsx(styles.panel, styles.panelHD)}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="rabby-internal://assets/icons/add-address/device.svg" />
          </div>
          <span className={styles.title}>Connect Hardware Wallets</span>
        </div>
        <div className={styles.body}>
          {HARDWARE_MAP.map((hardware) => (
            <div
              onClick={() => {
                onSelectType(hardware.id);
              }}
              className={styles.device}
            >
              <img className={styles.deviceLogo} src={hardware.logo} />
              <span className={styles.deviceName}>{hardware.name}</span>
            </div>
          ))}
        </div>
      </div>

      <ContactTypeCard
        logo="rabby-internal://assets/icons/add-address/walletconnect.svg"
        title="Wallet Connect"
        onAction={() => onSelectType(KEYRING_CLASS.WALLETCONNECT)}
      />

      <ContactTypeCard
        logo="rabby-internal://assets/icons/add-address/cup.svg"
        title="Add Contacts"
        subtitle="You can also use it as a watch-only address"
        onAction={() => onSelectType(KEYRING_CLASS.WATCH)}
      />

      <ContactTypeCard
        logo="rabby-internal://assets/icons/add-address/cup.svg"
        title="Add Gnosis Safe"
        onAction={() => onSelectType(KEYRING_CLASS.GNOSIS)}
      />

      {!IS_RUNTIME_PRODUCTION && (
        <ContactTypeCard
          logo="rabby-internal://assets/icons/add-address/privatekey.svg"
          title="Import Private Key"
          onAction={() => onSelectType(KEYRING_CLASS.PRIVATE_KEY)}
        />
      )}
    </div>
  );
};
