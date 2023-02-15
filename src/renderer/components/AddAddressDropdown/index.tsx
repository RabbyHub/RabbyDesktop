import { Dropdown, Menu } from 'antd';
import {
  useZPopupLayerOnMain,
  useZPopupViewState,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import React from 'react';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import styles from './index.module.less';

interface KeyringLabel {
  logo: string;
  name: string;
  id: string;
}

const KEYRING_MAP: KeyringLabel[] = [
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
  {
    logo: 'rabby-internal://assets/icons/add-address/walletconnect.svg',
    name: 'Wallet Connect',
    id: KEYRING_CLASS.WALLETCONNECT,
  },
  {
    logo: 'rabby-internal://assets/icons/add-address/cup.svg',
    name: 'Add Contacts',
    id: KEYRING_CLASS.WATCH,
  },
];

if (!IS_RUNTIME_PRODUCTION) {
  KEYRING_MAP.push({
    logo: 'rabby-internal://assets/icons/add-address/privatekey.svg',
    name: 'Private Key',
    id: KEYRING_CLASS.PRIVATE_KEY,
  });
}

export default function AddAddressDropdown() {
  const { svVisible, svState, closeSubview } = useZPopupViewState(
    'add-address-dropdown'
  );
  const zActions = useZPopupLayerOnMain();
  const hoverRef = React.useRef(false);

  const handleClick = React.useCallback(
    (info: { key: string }) => {
      zActions.showZSubview('add-address-modal', {
        keyringType: info.key,
      });
      setTimeout(() => {
        closeSubview();
      }, 10);
    },
    [closeSubview, zActions]
  );

  const handleOpen = React.useCallback(() => {
    hoverRef.current = true;
  }, []);

  const handleClose = React.useCallback(() => {
    hoverRef.current = false;
    setTimeout(() => {
      if (!hoverRef.current) {
        closeSubview();
      }
    }, 100);
  }, [closeSubview]);

  return (
    <Dropdown
      open={svVisible}
      overlay={
        <div onMouseEnter={handleOpen} onMouseLeave={handleClose}>
          <Menu className={styles.Menu} onClick={handleClick}>
            {KEYRING_MAP.map((keyring) => (
              <Menu.Item className={styles.MenuItem} key={keyring.id}>
                <div className="flex items-center">
                  <img className={styles.Icon} src={keyring.logo} />
                  <span>{keyring.name}</span>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </div>
      }
    >
      <div
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className={styles.NewAccountIcon}
        style={{
          position: 'absolute',
          left: svState?.pos?.x,
          // icon height is 40px
          top: (svState?.pos?.y ?? 0) - 40,
        }}
      >
        <img
          className="block"
          src="rabby-internal://assets/icons/top-bar/add-address.svg"
        />
      </div>
    </Dropdown>
  );
}
