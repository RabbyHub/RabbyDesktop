import { Tabs } from 'antd';
import React from 'react';
import { WALLET_BRAND_TYPES } from '@/renderer/utils/constant';
import { QRCodePanel } from './QRCodePanel';
import { URLPanel } from './URLPanel';
import { ConnectStatus } from './ConnectStatus';

interface Props {
  uri: string;
  onReload: () => void;
  brand: WALLET_BRAND_TYPES;
}

export const QRCodeContainer: React.FC<Props> = ({ uri, brand, onReload }) => {
  const [tab, setTab] = React.useState<'QRCode' | 'URL'>('QRCode');

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

      <ConnectStatus className="mt-[32px]" brandName={brand} />
    </>
  );
};
