/* eslint-disable @typescript-eslint/no-shadow */
import minBy from 'lodash/minBy';
import { useEffect, useMemo, useState } from 'react';

import { TransactionGroup } from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import eventBus from '@/renderer/utils-shell/eventBus';
import { isSameAddress } from '@/renderer/utils/address';
import { findChainByID } from '@/renderer/utils/chain';
import { EVENTS } from '@/renderer/utils/constant';
import { useMemoizedFn, useMount } from 'ahooks';
import { Empty } from '../Empty';
import { SkipNonceAlert } from './components/SkipNonceAlert';
import { TransactionItem } from './components/TransactionItem';
import { useLoadTxRequests } from './hooks';
import './style.less';

const wallet = walletController;

export const TransactionHistory = () => {
  const [_pendingList, setPendingList] = useState<TransactionGroup[]>([]);
  const [_completeList, setCompleteList] = useState<TransactionGroup[]>([]);
  const { currentAccount: account } = useCurrentAccount();

  const pendingList = useMemo(() => {
    return _pendingList.filter((item) => findChainByID(item?.chainId));
  }, [_pendingList]);

  const completeList = useMemo(() => {
    return _completeList.filter((item) => findChainByID(item?.chainId));
  }, [_completeList]);

  const init = async () => {
    const { pendings, completeds } = await wallet.getTransactionHistory(
      account!.address
    );
    setPendingList(pendings);
    setCompleteList(completeds);
    console.log('loadList', pendings, completeds);
  };

  useMount(() => {
    init();
  });

  const { txRequests, reloadTxRequests } = useLoadTxRequests(pendingList);

  const handleReload = useMemoizedFn((params: { addressList: string[] }) => {
    if (
      account?.address &&
      params?.addressList?.find((item) => {
        return isSameAddress(item || '', account?.address || '');
      })
    ) {
      init();
      reloadTxRequests();
    }
  });

  useEffect(() => {
    eventBus.addEventListener(EVENTS.RELOAD_TX, handleReload);
    return () => {
      eventBus.removeEventListener(EVENTS.RELOAD_TX, handleReload);
    };
  }, [handleReload]);

  const isEmpty = useMemo(() => {
    return pendingList.length <= 0 && completeList.length <= 0;
  }, [pendingList, completeList]);

  return (
    <div className="tx-history">
      <SkipNonceAlert pendings={pendingList} reload={init} />
      {pendingList.length > 0 && (
        <div className="tx-history__pending">
          {pendingList.map((item) => (
            <TransactionItem
              item={item}
              key={`${item.chainId}-${item.nonce}`}
              canCancel={
                minBy(
                  pendingList.filter((i) => i.chainId === item.chainId),
                  (i) => i.nonce
                )?.nonce === item.nonce
              }
              reload={() => init()}
              txRequests={txRequests}
            />
          ))}
        </div>
      )}
      {completeList.length > 0 && (
        <div className="tx-history__completed">
          {completeList.map((item) => (
            <TransactionItem
              item={item}
              key={`${item.chainId}-${item.nonce}`}
              canCancel={false}
              txRequests={txRequests}
            />
          ))}
        </div>
      )}
      {isEmpty ? (
        <Empty
          title="No signed transactions yet"
          desc="All transactions signed via Rabby will be listed here."
          className="pt-[120px]"
        />
      ) : null}
    </div>
  );
};
