import { useMessageForwardToMainwin } from '@/renderer/hooks/useMessageToMainwin';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import clsx from 'clsx';
import React from 'react';
import styles from './AddAddressModal.module.less';

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
    disabled: true,
  },
  {
    logo: 'rabby-internal://assets/icons/device/onekey.svg',
    name: 'OneKey',
    id: KEYRING_CLASS.HARDWARE.ONEKEY,
    disabled: true,
  },
];

interface Props {
  onSelectType: (type: string) => void;
}

export const SelectModalContent: React.FC<Props> = ({ onSelectType }) => {
  const mainNav = useMessageForwardToMainwin('route-navigate');

  const handleImportByPrivateKey = React.useCallback(() => {
    mainNav({
      type: 'route-navigate',
      data: {
        pathname: '/import-by/private-key',
      },
    });
    hideMainwinPopupview('add-address', {
      reloadView: true,
    });
    hideMainwinPopupview('address-management', {
      reloadView: true,
    });
  }, [mainNav]);

  return (
    <div className={styles.SelectModalContent}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <img src="rabby-internal://assets/icons/add-address/device.svg" />
          </div>
          <span className={styles.title}>Connect Hardware Wallets</span>
        </div>
        <div className={styles.body}>
          {HARDWARE_MAP.map((hardware) => (
            <div
              aria-disabled={hardware.disabled}
              onClick={() => {
                if (!hardware.disabled) {
                  onSelectType(hardware.id);
                }
              }}
              className={styles.device}
            >
              <img className={styles.deviceLogo} src={hardware.logo} />
              <span className={styles.deviceName}>{hardware.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        className={clsx(styles.panel, styles.panelContact)}
        onClick={() => onSelectType(KEYRING_CLASS.WATCH)}
      >
        <div className={styles.logo}>
          <img src="rabby-internal://assets/icons/add-address/cup.svg" />
        </div>
        <div className={styles.content}>
          <span className={styles.title}>Add Contacts</span>
          <span className={styles.subtitle}>
            You can also use it as a watch-only address
          </span>
        </div>
        <div className={styles.action}>
          <img src="rabby-internal://assets/icons/add-address/arrow-right.svg" />
        </div>
      </div>

      <div
        className={clsx(styles.panel, styles.panelContact)}
        onClick={handleImportByPrivateKey}
      >
        <div className={styles.logo}>
          <img src="rabby-internal://assets/icons/add-address/privatekey.svg" />
        </div>
        <div className={styles.content}>
          <span className={styles.title}>Import Private Key</span>
        </div>
        <div className={styles.action}>
          <img src="rabby-internal://assets/icons/add-address/arrow-right.svg" />
        </div>
      </div>
    </div>
  );
};
