import { useAccountToDisplay } from '@/renderer/hooks/rabbyx/useAccountToDisplay';
import { useWalletRequest } from '@/renderer/hooks/useWalletRequest';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import eventBus from '@/renderer/utils-shell/eventBus';
import {
  EVENTS,
  WALLETCONNECT_STATUS_MAP,
  WALLET_BRAND_TYPES,
} from '@/renderer/utils/constant';
import { Button, message, Tabs } from 'antd';
import React from 'react';
import { BridgeFormModal } from './BridgeFormModal';
import { QRCodePanel } from './QRCodePanel';
import { URLPanel } from './URLPanel';
import styles from './WalletConnectModal.module.less';

export const DEFAULT_BRIDGE = 'https://bridge.walletconnect.org';

const DEFAULT_BRAND = WALLET_BRAND_TYPES.WalletConnect;

interface Props {
  onSuccess: () => void;
}

export const WalletConnectModalContent: React.FC<Props> = ({ onSuccess }) => {
  const { getAllAccountsToDisplay } = useAccountToDisplay();
  const [walletConnectUri, setWalletConnectUri] = React.useState('');
  const [result, setResult] = React.useState('');
  const [bridgeURL, setBridgeURL] = React.useState(DEFAULT_BRIDGE);
  const [visibleBridgeForm, setVisibleBridgeForm] = React.useState(false);
  const [tab, setTab] = React.useState<'QRCode' | 'URL'>('QRCode');

  const [run] = useWalletRequest(walletController.importWalletConnect, {
    onSuccess() {
      // back to home page
      getAllAccountsToDisplay();
      onSuccess();
    },
    onError(err: { message: any }) {
      message.error(err?.message);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleImportByWalletConnect();
    },
  });

  const handleImportByWalletConnect = React.useCallback(async () => {
    const { uri, stashId } = await walletController.initWalletConnect(
      DEFAULT_BRAND,
      bridgeURL
    );
    setWalletConnectUri(uri);

    eventBus.removeAllEventListeners(EVENTS.WALLETCONNECT.STATUS_CHANGED);
    eventBus.addEventListener(
      EVENTS.WALLETCONNECT.STATUS_CHANGED,
      ({ status, payload }) => {
        switch (status) {
          case WALLETCONNECT_STATUS_MAP.CONNECTED:
            setResult(payload);
            run(
              payload,
              DEFAULT_BRAND,
              bridgeURL,
              stashId === null ? undefined : stashId
            );
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
  }, [bridgeURL, run]);

  React.useEffect(() => {
    handleImportByWalletConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridgeURL]);

  return (
    <div className={styles.Content}>
      <Tabs
        activeKey={tab}
        onChange={(active) => setTab(active as any)}
        className="rabby-tabs"
        items={[
          {
            label: 'QR code',
            key: 'QRCode',
            children: (
              <QRCodePanel
                uri={walletConnectUri}
                onReload={handleImportByWalletConnect}
              />
            ),
          },
          {
            label: 'URL',
            key: 'URL',
            children: (
              <URLPanel
                uri={walletConnectUri}
                onReload={handleImportByWalletConnect}
              />
            ),
          },
        ]}
      />

      <div className={styles.Footer}>
        <p className={styles.Tip}>
          WalletConnect will be unstable if you use VPN.
        </p>
        <Button
          className={styles.BridgeButton}
          onClick={() => setVisibleBridgeForm(true)}
          type="link"
          icon={
            <img
              className="mr-4 block"
              src="rabby-internal://assets/icons/walletconnect/setting.svg"
            />
          }
        >
          Change bridge server
        </Button>
      </div>
      <BridgeFormModal
        defaultValue={DEFAULT_BRIDGE}
        value={bridgeURL}
        onChange={setBridgeURL}
        open={visibleBridgeForm}
        onClose={() => setVisibleBridgeForm(false)}
      />
    </div>
  );
};
