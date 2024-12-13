import { useInViewport, useInfiniteScroll } from 'ahooks';
import React, { useEffect, useRef } from 'react';
import { useAsync } from 'react-use';
import { uniqBy } from 'lodash';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { atom, useAtom } from 'jotai';

const refreshHistoryAtom = atom(0);

export const useRefreshBridgeHistory = () => useAtom(refreshHistoryAtom);

export const useBridgeHistory = () => {
  const { currentAccount } = useCurrentAccount();
  const addr = currentAccount?.address;

  const [refreshTxListCount, setRefreshListTx] = useRefreshBridgeHistory();
  const refreshBridgeListTx = React.useCallback(() => {
    setRefreshListTx((e) => e + 1);
  }, [setRefreshListTx]);
  const isInBridge = true;

  const getBridgeHistoryList = React.useCallback(
    async (address: string, start = 0, limit = 5) => {
      const data = await walletOpenapi.getBridgeHistoryList({
        user_addr: address,
        start,
        limit,
      });
      return {
        list: data?.history_list,
        last: data,
        totalCount: data?.total_cnt,
      };
    },
    []
  );

  const {
    data: txList,
    loading,
    loadMore,
    loadingMore,
    noMore,
    mutate,
  } = useInfiniteScroll(
    (d) =>
      getBridgeHistoryList(
        addr!,
        d?.list?.length && d?.list?.length > 1 ? d?.list?.length : 0,
        5
      ),
    {
      reloadDeps: [isInBridge],
      isNoMore(data) {
        if (data) {
          return data?.list.length >= data?.totalCount;
        }
        return true;
      },
      manual: !isInBridge || !addr,
    }
  );

  const { value } = useAsync(async () => {
    if (addr) {
      return getBridgeHistoryList(addr, 0, 5);
    }
  }, [addr, refreshTxListCount]);

  useEffect(() => {
    if (value?.list) {
      mutate((d) => {
        if (!d) {
          return;
        }
        return {
          last: d?.last,
          totalCount: d?.totalCount,
          list: uniqBy(
            [...(value.list || []), ...(d?.list || [])],
            (e) => `${e.chain}-${e.detail_url}`
          ),
        };
      });
    }
  }, [mutate, value]);

  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (!noMore && inViewport && !loadingMore && loadMore && isInBridge) {
      loadMore();
    }
  }, [inViewport, loadMore, loading, loadingMore, noMore, isInBridge]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      !loading &&
      !loadingMore &&
      txList?.list?.some((e) => e.status !== 'completed') &&
      isInBridge
    ) {
      timer = setTimeout(refreshBridgeListTx, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingMore, refreshBridgeListTx, txList?.list, isInBridge]);

  return {
    loading,
    txList,
    loadingMore,
    ref,
  };
};
