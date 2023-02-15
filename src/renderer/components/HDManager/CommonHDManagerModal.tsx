/* eslint-disable react-hooks/exhaustive-deps */
import './index.less';
import { Button, message } from 'antd';
import React from 'react';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import { HDManagerStateProvider, StateProviderProps } from './utils';
import { LedgerManager } from './LedgerManager';
import { OneKeyManager } from './OnekeyManager';
import { TrezorManager } from './TrezorManager';
import { Modal, Props as ModalProps } from '../Modal/Modal';

const MANAGER_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LedgerManager,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: TrezorManager,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: OneKeyManager,
};

interface Props extends StateProviderProps, ModalProps {
  showEntryButton?: boolean;
  onCancel?: ModalProps['onCancel'];
}

export const CommonHDManagerModal: React.FC<Props> = ({
  keyring,
  showEntryButton,
  onCancel,
  ...props
}) => {
  const walletController = useShellWallet();
  const [, setInitialed] = React.useState(false);
  const idRef = React.useRef<number | null>(null);
  const isLedger = keyring === HARDWARE_KEYRING_TYPES.Ledger.type;

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

        if (isLedger) {
          return walletController.requestKeyring(
            keyring,
            'unlock',
            idRef.current
          );
        }
      })
      .then(() => {
        setInitialed(true);
      })
      .catch((e: any) => {
        console.log(e);
        if (isLedger) {
          props.onBack?.();
          message.error(
            'Unable to connect to Hardware wallet. Please try to re-connect.'
          );
        }
      });
    window.addEventListener('beforeunload', () => {
      closeConnect();
    });

    return () => {
      closeConnect();
    };
  }, []);

  const Manager = MANAGER_MAP[keyring];

  return (
    <Modal
      {...props}
      onCancel={(e) => {
        onCancel?.(e);
        closeConnect();
      }}
    >
      <HDManagerStateProvider keyringId={idRef.current} keyring={keyring}>
        <div className="HDManager">
          <main>
            <Manager />
            {showEntryButton && (
              <Button
                onClick={onCancel}
                className="footer-button"
                type="primary"
              >
                Enter Rabby
              </Button>
            )}
          </main>
        </div>
      </HDManagerStateProvider>
    </Modal>
  );
};
