import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWalletRequest } from '@/renderer/hooks/useWalletRequest';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import eventBus from '@/renderer/utils-shell/eventBus';
import {
  EVENTS,
  WALLETCONNECT_STATUS_MAP,
  WALLET_BRAND_CONTENT,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { message } from 'antd';
import React from 'react';
import styles from './WalletConnectModal.module.less';
import { useSessionStatus } from './useSessionStatus';
import { QRCodeContainer } from './QRCodeContainer';

type Account = import('@/isomorphic/types/rabbyx').Account;

export const DEFAULT_BRIDGE = '';

interface Props {
  onSuccess: (accounts: Account[]) => void;
  brand: WALLET_BRAND_TYPES;
}

export const WalletConnectModalContent: React.FC<Props> = ({
  onSuccess,
  brand,
}) => {
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const [walletConnectUri, setWalletConnectUri] = React.useState('');
  const [result, setResult] = React.useState('');
  const [bridgeURL, setBridgeURL] = React.useState(DEFAULT_BRIDGE);
  const [tab, setTab] = React.useState<'QRCode' | 'URL'>('QRCode');
  const [curStashId, setCurStashId] = React.useState<number | null>(null);
  const { status: sessionStatus, currAccount } = useSessionStatus();
  const [runParams, setRunParams] = React.useState<
    Parameters<typeof run> | undefined
  >();

  const [run] = useWalletRequest(walletController.importWalletConnect, {
    onSuccess(data) {
      // back to home page
      getAllAccountsToDisplay();
      onSuccess(data);
    },
    onError(err: { message: any }) {
      message.error(err?.message);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleImportByWalletConnect();
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleRun = async (options: Parameters<typeof run>) => {
    const [payload, brandName, account] = options as any;
    const {
      peer: { metadata },
    } = payload as any;

    options[0] = account.address;
    if (brandName === WALLET_BRAND_TYPES.WalletConnect) {
      if (metadata?.name) {
        options[1] = currAccount!.brandName;
        options[4] = metadata.name;
        options[5] = metadata.icons?.[0];
      }
    }
    run(...options);
  };

  const handleImportByWalletConnect = React.useCallback(async () => {
    const { stashId } = await walletController.initWalletConnect(
      brand,
      curStashId,
      1
    );
    setCurStashId(stashId);

    eventBus.removeAllEventListeners(EVENTS.WALLETCONNECT.STATUS_CHANGED);
    eventBus.addEventListener(
      EVENTS.WALLETCONNECT.STATUS_CHANGED,
      ({ status, account, payload }) => {
        switch (status) {
          case WALLETCONNECT_STATUS_MAP.CONNECTED:
            setResult(payload);
            setRunParams([
              payload,
              brand,
              account,
              stashId === null ? undefined : stashId,
            ]);
            break;
          case WALLETCONNECT_STATUS_MAP.FAILD:
          case WALLETCONNECT_STATUS_MAP.REJECTED:
            handleImportByWalletConnect();
            break;
          case WALLETCONNECT_STATUS_MAP.SIBMITTED:
            setResult(payload);
            break;
          default:
            break;
        }
      }
    );
  }, [brand, curStashId]);

  React.useEffect(() => {
    eventBus.addEventListener(EVENTS.WALLETCONNECT.INITED, ({ uri }) => {
      setWalletConnectUri(uri);
    });
    handleImportByWalletConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // refresh when status is not connected
    if (sessionStatus && sessionStatus !== 'CONNECTED') {
      handleImportByWalletConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  React.useEffect(() => {
    if (sessionStatus === 'CONNECTED' && runParams?.length) {
      handleRun(runParams);
    } else {
      setRunParams(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, runParams]);

  const isCommonWalletConnect = brand === WALLET_BRAND_TYPES.WalletConnect;

  return (
    <div className={styles.Content}>
      <div className="w-[80px] mb-[52px] relative mx-auto">
        <img className="w-full" src={WALLET_BRAND_CONTENT[brand].icon} />
        {!isCommonWalletConnect && (
          <img
            className="absolute -bottom-[3px] -right-[3px] w-[24px]"
            src={WALLET_BRAND_CONTENT.WalletConnect.icon}
          />
        )}
      </div>
      <QRCodeContainer
        uri={walletConnectUri}
        onReload={handleImportByWalletConnect}
        brand={brand}
      />
    </div>
  );
};
