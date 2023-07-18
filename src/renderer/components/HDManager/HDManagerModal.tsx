import React from 'react';
import {
  HARDWARE_KEYRING_TYPES,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { Props as ModalProps } from '../Modal/Modal';
import { CommonHDManagerModal } from './CommonHDManagerModal';
import { QRCodeConnectModal } from './QRCodeConnectModal';

export interface Props extends ModalProps {
  keyringType: string;
  showEntryButton?: boolean;
  brand?: WALLET_BRAND_TYPES;
}

export const HDManagerModal: React.FC<Props> = ({
  keyringType,
  showEntryButton,
  onCancel,
  ...props
}) => {
  const handleClose = React.useCallback(() => {
    onCancel?.();
  }, [onCancel]);
  const [isFinished, setIsFinished] = React.useState(true);
  const [keyringId, setKeyringId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (keyringType === HARDWARE_KEYRING_TYPES.Keystone.type) {
      setIsFinished(false);
    }
  }, [keyringType]);

  const onReset = React.useCallback(() => {
    setKeyringId(null);
    setIsFinished(false);
  }, []);

  if (!isFinished && keyringType === HARDWARE_KEYRING_TYPES.Keystone.type) {
    return (
      <QRCodeConnectModal
        onFinish={(id) => {
          setKeyringId(id);
          setIsFinished(true);
        }}
        brand={props.brand}
        onClose={handleClose}
      />
    );
  }

  return (
    <CommonHDManagerModal
      {...props}
      centered
      className="HDManagerModal"
      width={1280}
      onCancel={handleClose}
      keyring={keyringType}
      keyringId={keyringId}
      showEntryButton={showEntryButton}
      onReset={onReset}
    />
  );
};
