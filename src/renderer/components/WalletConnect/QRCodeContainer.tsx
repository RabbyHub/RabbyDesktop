import { Tabs } from 'antd';
import React from 'react';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { QRCodePanel } from './QRCodePanel';
import { URLPanel } from './URLPanel';
import { ConnectStatus } from './ConnectStatus';
import { useSessionStatus } from './useSessionStatus';

type Account = import('@/isomorphic/types/rabbyx').Account;

interface Props {
  uri: string;
  onReload: () => void;
  brand: WALLET_BRAND_TYPES;
  account?: Account;
}

export const QRCodeContainer: React.FC<Props> = ({
  uri,
  brand,
  onReload,
  account,
}) => {
  const [tab, setTab] = React.useState<'QRCode' | 'URL'>('QRCode');
  const { status } = useSessionStatus(account);

  React.useEffect(() => {
    // refresh when status is not connected
    if (status && status !== 'CONNECTED') {
      onReload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <>
      <Tabs
        activeKey={tab}
        onChange={(active) => setTab(active as any)}
        className="rabby-tabs walletconnect"
        items={[
          {
            label: 'QR code',
            key: 'QRCode',
            children: <QRCodePanel uri={uri} onReload={onReload} />,
          },
          {
            label: 'URL',
            key: 'URL',
            children: <URLPanel uri={uri} onReload={onReload} />,
          },
        ]}
      />

      <ConnectStatus
        account={account}
        className="mt-[32px]"
        brandName={brand}
      />
    </>
  );
};
