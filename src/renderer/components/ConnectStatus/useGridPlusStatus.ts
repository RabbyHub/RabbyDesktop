import { walletController } from '@/renderer/ipcRequest/rabbyx';
import React from 'react';
import { useInterval } from 'react-use';

export const useGridPlusStatus = () => {
  const [isConnect, setIsConnect] = React.useState(false);
  const getConnectStatus = () => {
    walletController.gridPlusIsConnect().then((res) => setIsConnect(!!res));
  };
  const [connectLoading, setConnectLoading] = React.useState(false);

  React.useEffect(() => {
    getConnectStatus();
  }, []);

  useInterval(() => {
    getConnectStatus();
  }, 1000 * 2);

  const status: 'CONNECTED' | 'DISCONNECTED' = React.useMemo(() => {
    return isConnect ? 'CONNECTED' : 'DISCONNECTED';
  }, [isConnect]);

  const onClickConnect = async () => {
    if (connectLoading) {
      return;
    }
    setConnectLoading(true);
    try {
      const account = await walletController.syncGetCurrentAccount()!;
      await walletController.requestKeyring(
        account?.type || '',
        'unlock',
        null
      );
      getConnectStatus();
    } catch (e) {
      console.error(e);
    }
    setConnectLoading(false);
  };

  const content = React.useMemo(() => {
    return isConnect ? 'GridPlus is connected' : 'GridPlus is not connected';
  }, [isConnect]);

  return {
    content,
    onClickConnect,
    status,
    connectLoading,
  };
};
