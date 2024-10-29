import React from 'react';
import { useHIDDevices } from '@/renderer/hooks/useDevices';
import { useCommonPopupView } from '../CommonPopup/useCommonPopupView';

type Status =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ADDRESS_ERROR'
  | 'LOCKED'
  | undefined;

export const ledgerUSBVendorId = 0x2c97;

export const useLedgerStatus = () => {
  const { activePopup } = useCommonPopupView();
  const [content, setContent] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
  const [status, setStatus] = React.useState<Status>('DISCONNECTED');

  const onClickConnect = () => {
    activePopup('Ledger');
  };

  React.useEffect(() => {
    switch (status) {
      case 'CONNECTED':
        setContent('Connected and ready to sign');
        break;

      case 'ADDRESS_ERROR':
        setContent('Connected but unable to sign');
        setDescription('The current address does not belong to this device');
        break;

      case 'LOCKED':
        setContent('Connected but unable to sign');
        setDescription('Please unlock your Ledger and open Ethereum App');
        break;

      case 'DISCONNECTED':
      case undefined:
      default:
        setContent('Ledger is not connected');
        break;
    }
  }, [status]);

  const { devices } = useHIDDevices();

  React.useEffect(() => {
    const hasLedger = devices.some(
      (item) => item.vendorId === ledgerUSBVendorId
    );
    if (hasLedger) {
      setStatus('CONNECTED');
    } else {
      setStatus('DISCONNECTED');
    }
  }, [devices]);

  return {
    content,
    description,
    onClickConnect,
    status,
  };
};
