import { useMessageForwardToMainwin } from '@/renderer/hooks/useViewsMessage';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import React from 'react';
import { HDManagerModal } from '../HDManager/HDManagerModal';
import { Modal } from '../Modal/Modal';
import { WalletConnectModal } from '../WalletConnect/WalletConnectModal';
import { ContactModalContent } from './ContactModalContent';

export interface Props {
  keyringType?: string;
  onBack?: () => void;
  visible: boolean;
  onCancel: () => void;
  showEntryButton?: boolean;
}

export const AddAddressModalInner: React.FC<Props> = ({
  keyringType,
  onBack,
  visible,
  onCancel,
  showEntryButton,
}) => {
  const mainNav = useMessageForwardToMainwin('route-navigate');

  const handleImportByPrivateKey = React.useCallback(() => {
    mainNav({
      type: 'route-navigate',
      data: {
        pathname: '/import-by/private-key',
      },
    } as any);
    hideMainwinPopupview('address-management', {
      reloadView: true,
    });
  }, [mainNav]);

  React.useEffect(() => {
    if (keyringType === KEYRING_CLASS.PRIVATE_KEY) {
      handleImportByPrivateKey();
    }
  }, [handleImportByPrivateKey, keyringType]);

  if (keyringType === KEYRING_CLASS.WATCH) {
    return (
      <Modal
        centered
        open={visible}
        title="Add Contacts"
        subtitle="You can also use it as a watch-only address"
        backable={!!onBack}
        onBack={onBack}
        destroyOnClose
        onCancel={onCancel}
        footer={null}
      >
        <ContactModalContent onSuccess={onCancel} />
      </Modal>
    );
  }

  if (keyringType === KEYRING_CLASS.WALLETCONNECT) {
    return (
      <WalletConnectModal
        centered
        open={visible}
        title="Wallet Connect"
        backable={!!onBack}
        onBack={onBack}
        destroyOnClose
        onCancel={onCancel}
        footer={null}
        onSuccess={onCancel}
      />
    );
  }

  if (
    keyringType &&
    [
      KEYRING_CLASS.HARDWARE.LEDGER,
      KEYRING_CLASS.HARDWARE.ONEKEY,
      KEYRING_CLASS.HARDWARE.TREZOR,
    ].includes(keyringType)
  ) {
    return (
      <HDManagerModal
        open={visible}
        onCancel={onCancel}
        destroyOnClose
        keyringType={keyringType}
        footer={null}
        backable={!!onBack}
        onBack={onBack}
        showEntryButton={showEntryButton}
      />
    );
  }

  return null;
};
