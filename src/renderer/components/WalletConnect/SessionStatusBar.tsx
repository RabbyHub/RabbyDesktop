import React from 'react';
import { message } from 'antd';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { SessionSignal } from './SessionSignal';
import { useSessionStatus } from './useSessionStatus';
import { useDisplayBrandName } from './useDisplayBrandName';
import { CommonStatusBar } from '../ConnectStatus/CommonStatusBar';
import { useCommonPopupView } from '../CommonPopup/useCommonPopupView';

interface Props {
  address: string;
  brandName: string;
  className?: string;
}

export const SessionStatusBar: React.FC<Props> = ({
  address,
  brandName,
  className,
}) => {
  const { status } = useSessionStatus(
    {
      address,
      brandName,
    },
    true
  );
  const { activePopup, setAccount } = useCommonPopupView();
  const wallet = walletController;
  const [displayBrandName, realBrandName] = useDisplayBrandName(
    brandName as WALLET_BRAND_TYPES,
    address
  );

  const tipStatus = React.useMemo(() => {
    switch (status) {
      case 'ACCOUNT_ERROR':
        return 'ACCOUNT_ERROR';
      case undefined:
      case 'DISCONNECTED':
      case 'RECEIVED':
      case 'REJECTED':
      case 'BRAND_NAME_ERROR':
        return 'DISCONNECTED';

      default:
        return 'CONNECTED';
    }
  }, [status]);

  const handleButton = () => {
    setAccount({
      address,
      brandName,
      realBrandName,
    });
    if (tipStatus === 'CONNECTED') {
      wallet.killWalletConnectConnector(address, brandName, true);
      message.success('Disconnected');
    } else if (tipStatus === 'DISCONNECTED') {
      wallet.killWalletConnectConnector(address, brandName, true, true);
      activePopup('WalletConnect');
    } else if (tipStatus === 'ACCOUNT_ERROR') {
      activePopup('SwitchAddress');
    }
  };

  const TipContent = () => {
    switch (tipStatus) {
      case 'ACCOUNT_ERROR':
        return (
          <>
            <div>Connected but unable to sign.</div>
            <div className="mt-[5px]">
              Please switch to the correct address in mobile wallet
            </div>
          </>
        );

      case 'DISCONNECTED':
        return <div>Not connected to {displayBrandName}</div>;

      default:
        return <div>Connected to {displayBrandName}</div>;
    }
  };

  return (
    <CommonStatusBar
      Signal={
        <SessionSignal
          size="small"
          address={address}
          brandName={brandName}
          className="mt-[4px]"
          pendingConnect
        />
      }
      className={className}
      onClickButton={handleButton}
      ButtonText={
        <>
          {tipStatus === 'CONNECTED' && 'Disconnect'}
          {tipStatus === 'DISCONNECTED' && 'Connect'}
          {tipStatus === 'ACCOUNT_ERROR' && 'How to switch'}
        </>
      }
      Content={<TipContent />}
    />
  );
};
