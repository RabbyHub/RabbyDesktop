import './index.less';
import { Spin } from 'antd';
import React from 'react';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import { HDManagerStateProvider, StateProviderProps } from './utils';
import { LedgerManager } from './LedgerManager';
import { OneKeyManager } from './OnekeyManager';
import { TrezorManager } from './TrezorManager';

const MANAGER_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LedgerManager,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: TrezorManager,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: OneKeyManager,
};

export const HDManager: React.FC<StateProviderProps> = ({ keyring }) => {
  const walletController = useShellWallet();
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
      .then((id: number) => {
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

  const Manager = MANAGER_MAP[keyring];

  return (
    <HDManagerStateProvider keyringId={idRef.current} keyring={keyring}>
      <div className="HDManager">
        <main>
          <Manager />
        </main>
      </div>
    </HDManagerStateProvider>
  );
};
