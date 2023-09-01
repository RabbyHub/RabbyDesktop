import { Modal } from '@/renderer/components/Modal/Modal';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { range } from 'lodash';
import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Empty } from './components/Empty';
import { Loading } from './components/Loading';
import { TransactionItem } from './components/TransactionItem';
import { useTxHistory } from './hooks/useTxHistory';
import { useTxSource } from './hooks/useTxSource';
import styles from './index.module.less';
import NetSwitchTabs, { useSwitchNetTab } from '../PillsSwitch/NetSwitchTabs';

const Transactions = ({ testnet = false }: { testnet?: boolean }) => {
  const { currentAccount } = useCurrentAccount();
  const ref = useRef<HTMLDivElement>(null);

  const { data, loading, loadingMore, mutate } = useTxHistory(
    currentAccount?.address as unknown as string,
    ref,
    testnet
  );

  useEffect(() => {
    mutate({
      last: 0,
      list: [],
    });
    ref?.current?.scrollTo(0, 0);
  }, [currentAccount?.address, mutate]);

  const isEmpty = !loading && data?.list.length === 0;

  const source = useTxSource(currentAccount?.address as unknown as string);

  return (
    <div ref={ref} className={styles.page}>
      {isEmpty ? (
        <Empty />
      ) : (
        <div className={styles.container}>
          {loading ? (
            range(5).map((i) => <Loading key={i} />)
          ) : (
            <>
              {data?.list.map((item) => {
                return (
                  <TransactionItem
                    key={item.id}
                    data={item}
                    projectDict={item.projectDict}
                    cateDict={item.cateDict}
                    tokenDict={item.tokenDict}
                    origin={source?.get([item.chain, item.id].join('|'))}
                  />
                );
              })}
              {loadingMore && <Loading />}
            </>
          )}
        </div>
      )}
    </div>
  );
};

interface TransactionModalProps {
  open?: boolean;
  onClose?: () => void;
}
export const TransactionModal = ({ open, onClose }: TransactionModalProps) => {
  const { isShowTestnet, onTabChange, selectedTab } = useSwitchNetTab();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      className={styles.transactionModal}
      width={1070}
      centered
      destroyOnClose
    >
      <div
        className={clsx(styles.transactionModalTitle, isShowTestnet && 'pb-18')}
      >
        Transactions
      </div>
      {isShowTestnet && (
        <div className="flex justify-center mb-32">
          <NetSwitchTabs value={selectedTab} onTabChange={onTabChange} />
        </div>
      )}

      <Transactions
        testnet={isShowTestnet && selectedTab === 'testnet'}
        key={selectedTab}
      />
    </Modal>
  );
};
