import { useState, useEffect, useRef } from 'react';
import PQueue from 'p-queue';
import { groupBy } from 'lodash';
import {
  ComplexProtocol,
  ServerChain,
  TokenItem,
} from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { VIEW_TYPE } from '../routes/Home/hooks';

export interface DisplayProtocol extends ComplexProtocol {
  usd_value: number;
}

const getNoHistoryPriceTokensFromProtocolList = (
  protocolList: DisplayProtocol[],
  historyProtocolMap: Record<string, DisplayProtocol>,
  supportHistoryChainList: ServerChain[]
) => {
  const noHistoryPriceTokens = new Set<string>();
  const historyTokenMap: Record<string, TokenItem> = {};
  protocolList
    .filter((item) => supportHistoryChainList.some((i) => i.id === item.chain))
    .forEach((item) => {
      if (!historyProtocolMap[item.id]) {
        item.portfolio_item_list.forEach((i) => {
          i.asset_token_list.forEach((token) => {
            noHistoryPriceTokens.add(`${token.chain}-${token.id}`);
          });
        });
      } else {
        const currentTokenList: string[] = [];
        const historyTokenList: string[] = [];
        item.portfolio_item_list.forEach((i) => {
          i.asset_token_list.forEach((k) => {
            currentTokenList.push(`${k.chain}-${k.id}`);
          });
        });
        historyProtocolMap[item.id].portfolio_item_list.forEach((i) => {
          i.asset_token_list.forEach((k) => {
            historyTokenList.push(`${k.chain}-${k.id}`);
            historyTokenMap[`${k.chain}-${k.id}`] = {
              ...k,
              amount: 0,
            };
          });
        });
        currentTokenList.forEach((i) => {
          if (!historyTokenList.includes(i)) {
            noHistoryPriceTokens.add(i);
          }
        });
      }
    });
  return {
    noHistoryPriceTokenList: Array.from(noHistoryPriceTokens),
    historyTokenMap,
  };
};

export default (
  address: string | undefined,
  nonce = 0,
  currentView: VIEW_TYPE
) => {
  const addressRef = useRef(address);
  const [historyProtocolMap, setHistoryProtocolMap] = useState<
    Record<string, DisplayProtocol>
  >({});
  const [tokenHistoryPriceMap, setTokenHistoryPriceMap] = useState<
    Record<
      string,
      {
        price: number;
        id: string;
        chain: string;
      }
    >
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [supportHistoryChains, setSupportHistoryChains] = useState<
    ServerChain[]
  >([]);
  const [historyTokenDict, setHistoryTokenDict] = useState<
    Record<string, TokenItem>
  >({});
  const protocolListRef = useRef<DisplayProtocol[]>([]);
  const isHistoryLoadedRef = useRef(false);
  const isRealTimeLoadedRef = useRef(false);
  const isLoadingRealTimeRef = useRef(false);
  const isLoadingHistoryRef = useRef(false);

  const fetchData = async (addr: string, view: VIEW_TYPE) => {
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const result: DisplayProtocol[] = protocolListRef.current;
    const historyList: DisplayProtocol[] = [];
    const queue = new PQueue({ concurrency: 20 });
    const waitQueueFinished = (q: PQueue) => {
      return new Promise((resolve) => {
        q.on('empty', () => {
          if (q.pending <= 0) resolve(null);
        });
      });
    };
    if (!isRealTimeLoadedRef.current && !isLoadingRealTimeRef.current) {
      setIsLoading(true);
      isLoadingRealTimeRef.current = true;
      const cachedProtocols = await walletOpenapi.getComplexProtocolList(addr);
      protocolListRef.current = cachedProtocols.map((item) => ({
        ...item,
        usd_value: item.portfolio_item_list.reduce(
          (sum, i) => sum + i.stats.net_usd_value,
          0
        ),
      }));
      setIsLoading(false);
      const list = await walletOpenapi.getProtocolList(addr);
      list.forEach((item) => {
        queue.add(() => walletOpenapi.getProtocol({ addr, id: item.id }));
      });
      queue.on('completed', (r: ComplexProtocol) => {
        if (r.portfolio_item_list.length > 0) {
          result.push({
            ...r,
            usd_value: r.portfolio_item_list.reduce(
              (sum, item) => sum + item.stats.net_usd_value,
              0
            ),
          });
        }
      });
      await waitQueueFinished(queue);
      isRealTimeLoadedRef.current = true;
      isLoadingRealTimeRef.current = false;
      setForceUpdate((prev) => !prev);
    }
    if (view === VIEW_TYPE.DEFAULT) return;
    if (!isHistoryLoadedRef.current && !isLoadingHistoryRef.current) {
      isLoadingHistoryRef.current = true;
      const chainList = await walletOpenapi.getChainList();
      const supportHistoryChainList = chainList.filter(
        (item) => item.is_support_history
      );
      setSupportHistoryChains(supportHistoryChainList);
      const historyQueue = new PQueue({ concurrency: 20 });
      if (addr === addressRef.current) {
        protocolListRef.current = result;
      }
      result.forEach((item) => {
        if (supportHistoryChainList.some((i) => i.id === item.chain)) {
          historyQueue.add(async () => {
            const r = await walletOpenapi.getHistoryProtocol({
              addr,
              id: item.id,
              timeAt: YESTERDAY,
            });
            historyList.push({
              ...r,
              usd_value: r.portfolio_item_list.reduce(
                (sum, i) => sum + i.stats.net_usd_value,
                0
              ), // 只用作排序和筛选，不需要准确计算
            });
          });
        }
      });
      await waitQueueFinished(historyQueue);
      const map: Record<string, DisplayProtocol> = historyList.reduce(
        (res, item) => {
          return {
            ...res,
            [item.id]: item,
          };
        },
        {}
      );
      if (addr === addressRef.current) {
        setHistoryProtocolMap(map);
      }
      const { noHistoryPriceTokenList, historyTokenMap } =
        getNoHistoryPriceTokensFromProtocolList(
          result,
          map,
          supportHistoryChainList
        );
      setHistoryTokenDict(historyTokenMap);
      const tmap: Record<
        string,
        {
          price: number;
          id: string;
          chain: string;
        }
      > = {};
      if (noHistoryPriceTokenList.length > 0) {
        const tokenHistoryPriceQueue = new PQueue({ concurrency: 20 });
        const grouped = groupBy(noHistoryPriceTokenList, (item) => {
          return item.split('-')[0];
        });
        Object.keys(grouped).forEach((i) => {
          const l = grouped[i];
          tokenHistoryPriceQueue.add(async () => {
            const priceMap = await walletOpenapi.getTokenHistoryDict({
              chainId: i,
              ids: l.map((s) => s.split('-')[1]).join(','),
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
        await waitQueueFinished(tokenHistoryPriceQueue);
      }
      if (addr === addressRef.current) {
        setTokenHistoryPriceMap(tmap);
        isLoadingHistoryRef.current = false;
        isHistoryLoadedRef.current = true;
      }
    }
  };

  useEffect(() => {
    isHistoryLoadedRef.current = false;
    isRealTimeLoadedRef.current = false;
    isLoadingHistoryRef.current = false;
    isLoadingRealTimeRef.current = false;
    protocolListRef.current = [];
    setHistoryProtocolMap({});
  }, [address, nonce]);

  useEffect(() => {
    if (!address) return;
    addressRef.current = address;
    fetchData(address, currentView);
  }, [address, nonce, currentView]);

  return {
    protocolList: protocolListRef.current,
    historyProtocolMap,
    tokenHistoryPriceMap,
    isLoading,
    isLoadingHistory: isLoadingHistoryRef.current,
    isLoadingRealTime: isLoadingRealTimeRef.current,
    supportHistoryChains,
    historyTokenDict,
  };
};
