import { walletController } from '@/renderer/ipcRequest/rabbyx';
import React from 'react';
import eventBus from '@/renderer/utils-shell/eventBus';
import { EVENTS, KEYRING_CLASS } from '@/renderer/utils/constant';
import { useHIDDevices } from '@/renderer/hooks/useDevices';
import { useCommonPopupView } from '../CommonPopup/useCommonPopupView';

type Status =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ADDRESS_ERROR'
  | 'LOCKED'
  | undefined;

export const ledgerUSBVendorId = 0x2c97;

export const useLedgerStatus = (address?: string) => {
  const { activePopup } = useCommonPopupView();
  const [useLedgerLive, setUseLedgerLive] = React.useState(false);
  const [content, setContent] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
  const [status, setStatus] = React.useState<Status>('DISCONNECTED');

  React.useEffect(() => {
    walletController.isUseLedgerLive().then(setUseLedgerLive);
  }, []);

  React.useEffect(() => {
    if (useLedgerLive) {
      setStatus('CONNECTED');
    }
  }, [useLedgerLive]);

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

  // React.useEffect(() => {
  //   const handle = (payload: Status) => {
  //     setStatus(payload);
  //   };

  //   eventBus.addEventListener(EVENTS.LEDGER.SESSION_CHANGE, handle);
  //   walletController
  //     .requestKeyring(KEYRING_CLASS.HARDWARE.LEDGER, 'getConnectStatus', null)
  //     .then((res) => {
  //       setStatus(res);
  //     });

  //   return () => {
  //     eventBus.removeEventListener(EVENTS.LEDGER.SESSION_CHANGE, handle);
  //   };
  // }, []);

  // React.useEffect(() => {
  //   if (status === 'CONNECTED') {
  //     walletController
  //       .requestKeyring(
  //         KEYRING_CLASS.HARDWARE.LEDGER,
  //         'verifyAddressInDevice',
  //         null,
  //         address
  //       )
  //       .then((valid) => {
  //         if (!valid) {
  //           setStatus('ADDRESS_ERROR');
  //         }
  //       });
  //   }
  // }, [status, address]);

  const { devices, fetchDevices } = useHIDDevices();
  React.useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
