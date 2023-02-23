import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { range } from 'lodash';
import { useEffect, useRef } from 'react';
import { Empty } from './components/Empty';
import { Loading } from './components/Loading';
import { TransactionItem } from './components/TransactionItem';
import { useTxHistory } from './hooks/useTxHistory';
import { useTxSource } from './hooks/useTxSource';
import styles from './index.module.less';

const Transactions = () => {
  const { currentAccount } = useCurrentAccount();
  const ref = useRef<HTMLDivElement>(null);

  const { data, loading, loadingMore, mutate } = useTxHistory(
    currentAccount?.address as unknown as string,
    ref
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

export default Transactions;
