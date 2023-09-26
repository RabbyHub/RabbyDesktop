import { useCallback, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import PQueue from 'p-queue';
import { groupBy } from 'lodash';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { VIEW_TYPE } from '@/renderer/routes/Home/type';
import { requestOpenApiWithChainId } from '@/main/utils/openapi';
import { useToken } from './rabbyx/useToken';
import { markEffectHookIsOnetime } from 'react-fiber-keep-alive';

export interface TokenWithHistoryItem {
  current: TokenItem;
  history: TokenItem;
}

export const loadCachedTokenList = async (addr: string, isTestnet: boolean) => {
  const list = await requestOpenApiWithChainId(
    ({ openapi }) => openapi.getCachedTokenList(addr),
    {
      isTestnet,
    }
  );
  return list.map((item) => ({
    ...item,
    usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
  }));
};
export const loadRealTimeTokenList = async (
  addr: string,
  isTestnet: boolean
) => {
  const list = await requestOpenApiWithChainId(
    ({ openapi }) => openapi.listToken(addr),
    {
      isTestnet,
    }
  );
  return list.map((item) => ({
    ...item,
    usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
  }));
};

export default (
  address: string | undefined,
  nonce = 0,
  currentView: VIEW_TYPE,
  isTestnet: boolean
) => {
  const tokenListRef = useRef<TokenItem[]>([]);
  const [historyTokenMap, setHistoryTokenMap] = useState<
    Record<string, TokenItem>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(true);
  const isRealTimeLoadedRef = useRef(false);
  const isHistoryLoadedRef = useRef(false);
  const isLoadingHistory = useRef(false);
  const { setTokenList } = useToken(isTestnet);
  const addressRef = useRef(address);
  const isTestnetRef = useRef(isTestnet);

  const loadCache = async (addr: string, _isTestnet: boolean) => {
    if (isHistoryLoadedRef.current) return;
    try {
      const list = await loadCachedTokenList(addr, _isTestnet);
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
        tokenListRef.current = list;
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const loadRealTime = async (addr: string, _isTestnet: boolean) => {
    if (isRealTimeLoadedRef.current) return;
    try {
      const list = await loadRealTimeTokenList(addr, _isTestnet);
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
        tokenListRef.current = list;
      }
      setIsLoadingRealTime(false);
      isRealTimeLoadedRef.current = true;
    } catch (e) {
      setIsLoadingRealTime(false);
    }
  };

  const loadHistory = async (addr: string, _isTestnet: boolean) => {
    if (isHistoryLoadedRef.current) return;
    try {
      isLoadingHistory.current = true;
      const list = tokenListRef.current;
      const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
      const yesterdayTokenList = await requestOpenApiWithChainId(
        ({ openapi }) =>
          openapi.getHistoryTokenList({
            id: addr,
            timeAt: YESTERDAY,
          }),
        {
          isTestnet: _isTestnet,
        }
      );
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
          const tokenHistoryPriceQueue = new PQueue({ concurrency: 100 });
          const grouped = groupBy(q, (item) => {
            return item.chain;
          });
          Object.keys(grouped).forEach((i) => {
            const l = grouped[i];
            tokenHistoryPriceQueue.add(async () => {
              const priceMap = await requestOpenApiWithChainId(
                ({ openapi }) =>
                  openapi.getTokenHistoryDict({
                    chainId: i,
                    ids: l.map((s) => s.id).join(','),
                    timeAt: YESTERDAY,
                  }),
                {
                  isTestnet: _isTestnet,
                }
              );
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
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
        setHistoryTokenMap(
          result.reduce((res, item) => {
            return {
              ...res,
              [`${item.chain}-${item.id}`]: item,
            };
          }, {})
        );
      }
      isHistoryLoadedRef.current = true;
    } catch (e) {
      isLoadingHistory.current = false;
    }
  };

  const fetchData = useCallback(
    async (addr: string, view: VIEW_TYPE, _isTestnet: boolean) => {
      if (!isRealTimeLoadedRef.current) {
        await loadCache(addr, _isTestnet);
        setTokenList(tokenListRef.current);
        await loadRealTime(addr, _isTestnet);
        setTokenList(tokenListRef.current);
      }
      if (view === VIEW_TYPE.DEFAULT) return;
      await loadHistory(addr, _isTestnet);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setTokenList]
  );

  useEffect(() => {
    isRealTimeLoadedRef.current = false;
    isHistoryLoadedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nonce, isTestnet, loadRealTimeTokenList]);

  useEffect((() => {
    tokenListRef.current = [];
    setIsLoading(true);
    setIsLoadingRealTime(true);
    setHistoryTokenMap({});
  }), [address, isTestnet]);

  useEffect((() => {
    if (!address) return;
    addressRef.current = address;
    isTestnetRef.current = isTestnet;
    fetchData(address, currentView, isTestnet);
  }), [address, currentView, fetchData, nonce, isTestnet]);

  return {
    tokenList: tokenListRef.current,
    historyTokenMap,
    isLoading,
    isLoadingRealTime,
  };
};
