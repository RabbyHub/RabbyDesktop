import React from 'react';
import { message } from 'antd';
import eventBus from '@/renderer/utils-shell/eventBus';
import {
  EVENTS,
  KEYRING_CLASS,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useDisplayBrandName } from './useDisplayBrandName';
import { useSessionStatus } from './useSessionStatus';
import { QRCodeContainer } from './QRCodeContainer';
import { useCommonPopupView } from '../CommonPopup/useCommonPopupView';

type Account = import('@/isomorphic/types/rabbyx').Account;

export const ReconnectView: React.FC = () => {
  const wallet = walletController;
  const {
    setTitle: setPopupViewTitle,
    setHeight,
    closePopup,
    visible,
    account,
  } = useCommonPopupView();
  const [qrCodeContent, setQRcodeContent] = React.useState('');
  const [currentAccount, setCurrentAccount] = React.useState<Account | null>(
    null
  );
  const { status, errorAccount } = useSessionStatus(account);
  const [displayBrandName] = useDisplayBrandName(
    (account?.realBrandName || account?.brandName) as WALLET_BRAND_TYPES
  );

  const initWalletConnect = async () => {
    eventBus.addEventListener(EVENTS.WALLETCONNECT.INITED, ({ uri }) => {
      setQRcodeContent(uri);
    });
    if (account && ['CONNECTED', 'DISCONNECTED'].includes(status as string)) {
      await wallet.killWalletConnectConnector(
        account.address,
        account.brandName,
        false,
        true
      );
    }
    eventBus.emit(EVENTS.broadcastToBackground, {
      method: EVENTS.WALLETCONNECT.INIT,
      data: account,
    });
  };

  const handleRefreshQrCode = () => {
    initWalletConnect();
  };

  const init = async () => {
    if (!account) return;
    setCurrentAccount({
      ...account,
      brandName: account.realBrandName || account.brandName,
      type: KEYRING_CLASS.WALLETCONNECT,
    });
    setPopupViewTitle(`Connect with ${displayBrandName}`);
    setHeight(440);
    initWalletConnect();
  };

  React.useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (visible) {
      initWalletConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  React.useEffect(() => {
    if (status === 'CONNECTED') {
      message.success({
        type: 'success',
        content: 'Connected',
      });
      closePopup();
    } else if (account && errorAccount && status === 'ACCOUNT_ERROR') {
      wallet.killWalletConnectConnector(
        errorAccount.address,
        errorAccount.brandName,
        true,
        true
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, errorAccount, status]);

  return (
    <div className="watchaddress">
      {currentAccount && visible && (
        <QRCodeContainer
          uri={qrCodeContent}
          onReload={handleRefreshQrCode}
          brand={currentAccount.brandName as WALLET_BRAND_TYPES}
          account={currentAccount}
        />
      )}
    </div>
  );
};
