import {
  SafeInfo,
  SafeTransactionItem,
} from '@rabby-wallet/gnosis-sdk/dist/api';
import classNames from 'classnames';
import React from 'react';
import { BasicSafeInfo } from '@rabby-wallet/gnosis-sdk';
import { TxItem } from './TxItem';

export interface Props {
  items: SafeTransactionItem[];
  networkId: string;
  safeInfo: BasicSafeInfo;
  onSubmit: (data: SafeTransactionItem) => void;
  onSign: (data: SafeTransactionItem) => void;
}

export const TxItemGroup: React.FC<Props> = ({
  items,
  networkId,
  safeInfo,
  onSubmit,
  onSign,
}) => {
  return (
    <div
      className={classNames(
        'flex flex-col',
        'border border-[#FFFFFF1A] border-solid rounded-[8px] text-white',
        'divide-y'
      )}
    >
      {items.length > 1 ? (
        <div
          className={classNames(
            'text-blue-light flex items-center',
            'py-[15px] px-[20px] border-solid border-0 border-[#FFFFFF1A]',
            'text-[12px]'
          )}
        >
          <img
            className="mr-[6px]"
            src="rabby-internal://assets/icons/queue/info.svg"
          />
          <span>
            These transactions conflict as they use the same nonce. Executing
            one will automatically replace the other(s).
          </span>
        </div>
      ) : null}
      {items.map((item) => (
        <TxItem
          key={item.safeTxHash}
          data={item}
          networkId={networkId}
          safeInfo={safeInfo}
          onSubmit={onSubmit}
          onSign={onSign}
        />
      ))}
    </div>
  );
};
