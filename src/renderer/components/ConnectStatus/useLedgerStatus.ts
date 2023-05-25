import React from 'react';
import { useLedgerDeviceConnected } from '@/renderer/utils/ledger';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useCommonPopupView } from '../CommonPopup/useCommonPopupView';

export const useLedgerStatus = () => {
  const { activePopup } = useCommonPopupView();
  const hasConnectedLedgerHID = useLedgerDeviceConnected();
  const [useLedgerLive, setUseLedgerLive] = React.useState(false);
  const [content, setContent] = React.useState<string>();

  const status: 'CONNECTED' | 'DISCONNECTED' = React.useMemo(() => {
    if (useLedgerLive) {
      return 'CONNECTED';
    }
    return hasConnectedLedgerHID ? 'CONNECTED' : 'DISCONNECTED';
  }, [hasConnectedLedgerHID, useLedgerLive]);

  React.useEffect(() => {
    walletController.isUseLedgerLive().then(setUseLedgerLive);
  }, []);

  const onClickConnect = () => {
    activePopup('Ledger');
  };

  React.useEffect(() => {
    if (status === 'DISCONNECTED') {
      setContent('Ledger is not connected');
    } else {
      setContent('Ledger is connected');
    }
  }, [status]);

  return {
    content,
    onClickConnect,
    status,
  };
};
