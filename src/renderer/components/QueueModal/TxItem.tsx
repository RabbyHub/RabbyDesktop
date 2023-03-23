import { TxInterAddressExplain } from '@/renderer/routes/Transactions/components/TxInterAddressExplain';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { Button } from 'antd';
import React from 'react';

export interface Props {
  data: SafeTransactionItem;
}

export const TxItem: React.FC<Props> = ({ data }) => {
  return (
    <div className="grid">
      <div className="flex items-center">
        <time>
          <span>2021-08-12 12:00:00</span>
        </time>
      </div>
      {/* <TxInterAddressExplain /> */}
      <div>
        <Button>View and sign transaction</Button>
        <Button>Submit transaction</Button>
      </div>
    </div>
  );
};
