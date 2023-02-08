import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import PQueue from 'p-queue';
import { groupBy } from 'lodash';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

export interface TokenWithHistoryItem {
  current: TokenItem;
  history: TokenItem;
}

export default (address: string | undefined) => {
  const [tokenList, setTokenList] = useState<TokenItem[]>([]);
  const [historyTokenMap, setHistoryTokenMap] = useState<
    Record<string, TokenItem>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (addr: string) => {
    setIsLoading(true);
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const result: TokenItem[] = [];
    const cachedList = await walletOpenapi.getCachedTokenList(addr);
    setTokenList(
      cachedList.map((item) => ({
        ...item,
        usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
      }))
    );
    setIsLoading(false);
    const list = await walletOpenapi.listToken(addr);
    const q: TokenItem[] = [];
    setTokenList(
      list.map((item) => ({
        ...item,
        usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
      }))
    );
    const yesterdayTokenList = await walletOpenapi.getHistoryTokenList({
      id: addr,
      timeAt: YESTERDAY,
    });
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
  };

  useEffect(() => {
    if (!address) return;
    setTokenList([]);
    setHistoryTokenMap({});
    fetchData(address);
  }, [address]);

  return {
    tokenList,
    historyTokenMap,
    isLoading,
  };
};
