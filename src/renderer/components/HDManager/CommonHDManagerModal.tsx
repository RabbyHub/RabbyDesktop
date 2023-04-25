import './index.less';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { HARDWARE_KEYRING_TYPES } from '@/renderer/utils/constant';
import { useShellWallet } from '@/renderer/hooks-shell/useShellWallet';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { HDManagerStateProvider, StateProviderProps } from './utils';
import { LedgerManager } from './LedgerManager';
import { OneKeyManager } from './OnekeyManager';
import { TrezorManager } from './TrezorManager';
import { Modal, Props as ModalProps } from '../Modal/Modal';
import { useHDManagerConnecWindowOpen } from './useHDManager';

const MANAGER_MAP = {
  [HARDWARE_KEYRING_TYPES.Ledger.type]: LedgerManager,
  [HARDWARE_KEYRING_TYPES.Trezor.type]: TrezorManager,
  [HARDWARE_KEYRING_TYPES.Onekey.type]: OneKeyManager,
};

const enum HD_CONN_STEP {
  PREPARE = 0,
  CONNECTING = 1,
  STOPPED = 2,
}

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
  const [connectReq, setConnectReq] = React.useState({
    step: HD_CONN_STEP.PREPARE as HD_CONN_STEP,
    connected: false,
  });
  const idRef = React.useRef<number | null>(null);

  const { isLedger, HDManagerType } = useMemo(() => {
    return {
      isLedger: keyring === HARDWARE_KEYRING_TYPES.Ledger.type,
      HDManagerType: Object.values(HARDWARE_KEYRING_TYPES).find(
        (t) => t.type === keyring
      )?.brandName as HDManagerType,
    };
  }, [keyring]);

  const { isConnectWindowOpened } = useHDManagerConnecWindowOpen(HDManagerType);

  const closeConnect = React.useCallback(async () => {
    return walletController.requestKeyring(keyring, 'cleanUp', idRef.current);
  }, [walletController, keyring]);

  const initConnect = React.useCallback(async () => {
    setConnectReq({ connected: false, step: HD_CONN_STEP.CONNECTING });

    return walletController
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
        setConnectReq({ connected: true, step: HD_CONN_STEP.STOPPED });
      })
      .catch((e: any) => {
        console.error(e);
        if (isLedger) {
          // props.onBack?.();
          const filteredMessage = !e.message?.includes(`(reading '`)
            ? e.message
            : '';
          forwardMessageTo('main-window', 'toast-on-mainwin', {
            data: {
              type: 'ledger-connect-failed',
              message: filteredMessage,
            },
          });
        }
        setConnectReq({ connected: false, step: HD_CONN_STEP.STOPPED });
      });
  }, [walletController, keyring, isLedger]);

  const cleanupModal = React.useCallback(() => {
    onCancel?.();
    setConnectReq({ connected: false, step: HD_CONN_STEP.PREPARE });
  }, [onCancel]);

  React.useEffect(() => {
    if (connectReq.step === HD_CONN_STEP.STOPPED && !connectReq.connected) {
      cleanupModal();
    }
  }, [connectReq, cleanupModal]);

  React.useEffect(() => {
    if (keyring) {
      setConnectReq({ connected: false, step: HD_CONN_STEP.PREPARE });
    }
  }, [keyring]);

  React.useEffect(() => {
    initConnect();

    const listener = () => {
      closeConnect();
    };
    window.addEventListener('beforeunload', listener);

    return () => {
      closeConnect();
      window.removeEventListener('beforeunload', listener);
    };
  }, [initConnect, closeConnect]);

  if (connectReq.step === HD_CONN_STEP.STOPPED && !connectReq.connected) {
    return null;
  }

  const Manager = MANAGER_MAP[keyring];

  const handleClose = () => {
    cleanupModal();
    closeConnect();
  };

  return (
    <Modal
      {...props}
      style={{
        ...props.style,
        ...(isConnectWindowOpened && { visibility: 'hidden' }),
      }}
      maskStyle={{
        ...props.maskStyle,
        ...(isConnectWindowOpened && { visibility: 'hidden' }),
      }}
      onCancel={handleClose}
    >
      <HDManagerStateProvider keyringId={idRef.current} keyring={keyring}>
        <div className="HDManager">
          {connectReq.connected ? (
            <main>
              <Manager onClose={handleClose} />
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
          ) : null}
        </div>
      </HDManagerStateProvider>
    </Modal>
  );
};
