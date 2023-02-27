import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrevious } from 'react-use';
import BigNumber from 'bignumber.js';
import PQueue from 'p-queue';
import { groupBy } from 'lodash';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { VIEW_TYPE } from '@/renderer/routes/Home/hooks';

export interface TokenWithHistoryItem {
  current: TokenItem;
  history: TokenItem;
}

export default (
  address: string | undefined,
  nonce = 0,
  currentView: VIEW_TYPE
) => {
  const tokenListRef = useRef<TokenItem[]>([]);
  const [historyTokenMap, setHistoryTokenMap] = useState<
    Record<string, TokenItem>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false);
  const isRealTimeLoadedRef = useRef(false);
  const isHistoryLoadedRef = useRef(false);
  const isLoadingHistory = useRef(false);

  const loadCache = async (addr: string) => {
    if (isHistoryLoadedRef.current) return;
    try {
      setIsLoading(true);
      const cachedList = await walletOpenapi.getCachedTokenList(addr);
      tokenListRef.current = cachedList.map((item) => ({
        ...item,
        usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
      }));
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const loadRealTime = async (addr: string) => {
    if (isRealTimeLoadedRef.current) return;
    try {
      setIsLoadingRealTime(true);
      const list = await walletOpenapi.listToken(addr);
      tokenListRef.current = list.map((item) => ({
        ...item,
        usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
      }));
      setIsLoadingRealTime(false);
      isRealTimeLoadedRef.current = true;
    } catch (e) {
      setIsLoadingRealTime(false);
    }
  };

  const loadHistory = async (addr: string) => {
    if (isHistoryLoadedRef.current) return;
    try {
      isLoadingHistory.current = true;
      const list = tokenListRef.current;
      const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
      const yesterdayTokenList = await walletOpenapi.getHistoryTokenList({
        id: addr,
        timeAt: YESTERDAY,
      });
      const result: TokenItem[] = [];
      const q: TokenItem[] = [];
      for (let i = 0; i < list.length; i++) {
        const token = list[i];
        const yesterdayTokenItem = yesterdayTokenList.find(
          (item) => item.chain === token.chain && item.id === token.id
        );
        if (yesterdayTokenItem) {
          result.push({
            ...yesterdayTokenItem,
            usd_value: new BigNumber(yesterdayTokenItem.amount)
              .times(yesterdayTokenItem.price)
              .toNumber(),
          });
        } else {
          q.push(token);
        }
      }
      if (q.length > 0) {
        try {
          const tmap: Record<
            string,
            {
              price: number;
              id: string;
              chain: string;
            }
          > = {};
          const tokenHistoryPriceQueue = new PQueue({ concurrency: 20 });
          const grouped = groupBy(q, (item) => {
            return item.chain;
          });
          Object.keys(grouped).forEach((i) => {
            const l = grouped[i];
            tokenHistoryPriceQueue.add(async () => {
              const priceMap = await walletOpenapi.getTokenHistoryDict({
                chainId: i,
                ids: l.map((s) => s.id).join(','),
                timeAt: YESTERDAY,
              });
              return {
                chain: i,
                price: priceMap,
              };
            });
          });
          tokenHistoryPriceQueue.on(
            'completed',
            ({
              price,
              chain,
            }: {
              price: Record<string, number>;
              chain: string;
            }) => {
              Object.keys(price).forEach((id) => {
                tmap[`${chain}-${id}`] = { price: price[id], chain, id };
              });
            }
          );
          const waitQueueFinished = (queue: PQueue) => {
            return new Promise((resolve) => {
              queue.on('empty', () => {
                if (queue.pending <= 0) resolve(null);
              });
            });
          };
          await waitQueueFinished(tokenHistoryPriceQueue);
          Object.values(tmap).forEach((item) => {
            const target = q.find(
              (token) => token.id === item.id && token.chain === item.chain
            );
            if (target) {
              result.push({
                ...target,
                price: item.price,
                amount: 0,
              });
            }
          });
        } catch (e) {
          // NOTHING
        }
      }
      setHistoryTokenMap(
        result.reduce((res, item) => {
          return {
            ...res,
            [`${item.chain}-${item.id}`]: item,
          };
        }, {})
      );
      isHistoryLoadedRef.current = true;
    } catch (e) {
      isLoadingHistory.current = false;
    }
  };

  const fetchData = useCallback(async (addr: string, view: VIEW_TYPE) => {
    if (!isRealTimeLoadedRef.current) {
      await loadCache(addr);
      await loadRealTime(addr);
    }
    if (view === VIEW_TYPE.DEFAULT) return;
    await loadHistory(addr);
  }, []);

  useEffect(() => {
    tokenListRef.current = [];
    isRealTimeLoadedRef.current = false;
    isHistoryLoadedRef.current = false;
    setHistoryTokenMap({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nonce]);

  useEffect(() => {
    if (!address) return;
    fetchData(address, currentView);
  }, [address, currentView, fetchData, nonce]);

  return {
    tokenList: tokenListRef.current,
    historyTokenMap,
    isLoading,
    isLoadingRealTime,
  };
};
