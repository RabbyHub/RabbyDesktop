import './index.less';
import { Spin } from 'antd';
import React from 'react';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { HDManagerStateProvider, StateProviderProps } from './utils';
import { LedgerManager } from './LedgerManager';
import { OneKeyManager } from './OnekeyManager';
import { TrezorManager } from './TrezorManager';

const LOGO_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]:
    'rabby-internal://assets/icons/walletlogo/ledger.svg',
  [HARDWARE_KEYRING_TYPES.Trezor.type]:
    'rabby-internal://assets/icons/walletlogo/trezor.svg',
  [HARDWARE_KEYRING_TYPES.Onekey.type]:
    'rabby-internal://assets/icons/walletlogo/onekey.svg',
};

const LOGO_NAME_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: 'Ledger',
  [HARDWARE_KEYRING_TYPES.Trezor.type]: 'Trezor',
  [HARDWARE_KEYRING_TYPES.Onekey.type]: 'OneKey',
};

const MANAGER_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LedgerManager,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: TrezorManager,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: OneKeyManager,
};

export const HDManager: React.FC<StateProviderProps> = ({ keyring }) => {
  const [initialed, setInitialed] = React.useState(false);
  const idRef = React.useRef<number | null>(null);

  const closeConnect = React.useCallback(() => {
    walletController.requestKeyring(keyring, 'cleanUp', idRef.current);
  }, []);

  React.useEffect(() => {
    walletController
      .connectHardware({
        type: keyring,
        isWebHID: true,
      })
      .then((id) => {
        idRef.current = id;
        setInitialed(true);
      });

    window.addEventListener('beforeunload', () => {
      closeConnect();
    });

    return () => {
      closeConnect();
    };
  }, []);

  if (!initialed) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <Spin />
      </div>
    );
  }

  const LOGO_URL = LOGO_MAP[keyring];
  const Manager = MANAGER_MAP[keyring];
  const name = LOGO_NAME_MAP[keyring];

  return (
    <HDManagerStateProvider keyringId={idRef.current} keyring={keyring}>
      <div className="HDManager">
        <main>
          <div className="logo">
            <img className="icon" src={LOGO_URL} />
            <span className="title">Connected to {name}</span>
          </div>
          <Manager />
        </main>
      </div>
    </HDManagerStateProvider>
  );
};
