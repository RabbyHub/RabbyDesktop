import classNames from 'classnames';
import React from 'react';
import { SafeTransactionItem } from '@rabby-wallet/gnosis-sdk/dist/api';
import { TxItemGroup } from './TxItemGroup';
import { useSafeQueue } from './useSafeQueue';
import styles from './style.module.less';

export const TxList: React.FC = () => {
  const { transactionsGroup, networkId, safeInfo } = useSafeQueue();

  const handleSubmit = React.useCallback((data: SafeTransactionItem) => {
    console.log(data);
  }, []);

  return (
    <section
      className={classNames(
        'flex flex-col gap-[20px] px-[30px] pb-[20px]',
        'h-[70vh] overflow-y-scroll',
        styles.scrollbar
      )}
    >
      {Object.keys(transactionsGroup).map((key) => (
        <TxItemGroup
          key={key}
          items={transactionsGroup[key]}
          networkId={networkId}
          safeInfo={safeInfo!}
          onSubmit={handleSubmit}
        />
      ))}
    </section>
  );
};
