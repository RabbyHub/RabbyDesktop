import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import clsx from 'clsx';
import { range } from 'lodash';
import { useEffect, useRef } from 'react';
import { useTxHistory } from '../hooks/useTxHistory';
import { useTxSource } from '../hooks/useTxSource';
import styles from '../index.module.less';
import { Empty } from './Empty';
import { Loading } from './Loading';
import { TransactionItem } from './TransactionItem';

export const HistoryList = ({ isFilterScam }: { isFilterScam?: boolean }) => {
  const { currentAccount } = useCurrentAccount();
  const ref = useRef<HTMLDivElement>(null);

  const { data, loading, loadingMore, mutate } = useTxHistory(
    currentAccount?.address as unknown as string,
    ref,
    isFilterScam
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
    <>
      {loading && isFilterScam ? (
        <div className="text-r-neutral-body text-center text-[12px] leading-[14px] pt-[8px] pb-[22px]">
          Loading may take a moment, and data delays are possible
        </div>
      ) : null}

      <div
        ref={ref}
        className={clsx(styles.page, isFilterScam && !loading && 'mt-[30px]')}
      >
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
                      tokenDict={item.tokenDict || item.tokenUUIDDict || {}}
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
    </>
  );
};
