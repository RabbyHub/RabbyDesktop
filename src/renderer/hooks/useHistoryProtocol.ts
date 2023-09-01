import { useState, useEffect, useRef } from 'react';
import PQueue from 'p-queue';
import _, { groupBy } from 'lodash';
import {
  ComplexProtocol,
  ServerChain,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { requestOpenApiWithChainId } from '@/main/utils/openapi';
import { VIEW_TYPE } from '../routes/Home/type';

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

export const loadCachedProtocolList = async (
  addr: string,
  isTestnet: boolean
) => {
  const cachedProtocols = await requestOpenApiWithChainId(
    ({ openapi }) => openapi.getComplexProtocolList(addr),
    {
      isTestnet,
    }
  );
  return cachedProtocols.map((item) => ({
    ...item,
    usd_value: item.portfolio_item_list.reduce(
      (sum, i) => sum + i.stats.net_usd_value,
      0
    ),
  }));
};

export const loadRealTimeProtocolList = async (
  addr: string,
  isTestnet: boolean
) => {
  const result: DisplayProtocol[] = [];
  const queue = new PQueue({ concurrency: 100 });

  const waitQueueFinished = (q: PQueue) => {
    return new Promise((resolve) => {
      q.on('empty', () => {
        if (q.pending <= 0) resolve(null);
      });
    });
  };
  const list = await requestOpenApiWithChainId(
    ({ openapi }) => openapi.getProtocolList(addr),
    {
      isTestnet,
    }
  );

  list.forEach((item) => {
    queue.add(() =>
      requestOpenApiWithChainId(
        ({ openapi }) => openapi.getProtocol({ addr, id: item.id }),
        {
          isTestnet,
        }
      )
    );
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
  if (list.length > 0) {
    await waitQueueFinished(queue);
  }

  return result;
};

export default (
  address: string | undefined,
  nonce = 0,
  currentView: VIEW_TYPE,
  isTestnet = false
) => {
  const addressRef = useRef(address);
  const isTestnetRef = useRef(isTestnet);
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

  const fetchData = async (
    addr: string,
    view: VIEW_TYPE,
    _isTestnet: boolean
  ) => {
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    let result: DisplayProtocol[] = protocolListRef.current;
    const historyList: DisplayProtocol[] = [];
    const waitQueueFinished = (q: PQueue) => {
      return new Promise((resolve) => {
        q.on('empty', () => {
          if (q.pending <= 0) resolve(null);
        });
      });
    };
    if (!isRealTimeLoadedRef.current && !isLoadingRealTimeRef.current) {
      isLoadingRealTimeRef.current = true;
      result = [];
      const pList = await loadCachedProtocolList(addr, _isTestnet);
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
        protocolListRef.current = pList;
      }
      setIsLoading(false);
      const list = await loadRealTimeProtocolList(addr, _isTestnet);
      // if (list.length <= 0) {
      //   isRealTimeLoadedRef.current = true;
      //   isLoadingRealTimeRef.current = false;
      //   setForceUpdate((prev) => !prev);
      // }

      result.push(...list);
      isRealTimeLoadedRef.current = true;
      isLoadingRealTimeRef.current = false;
      setForceUpdate((prev) => !prev);
    }
    if (view === VIEW_TYPE.DEFAULT) return;
    if (!isHistoryLoadedRef.current && !isLoadingHistoryRef.current) {
      isLoadingHistoryRef.current = true;
      const chainList = await requestOpenApiWithChainId(
        ({ openapi }) => openapi.getChainList(),
        { isTestnet: _isTestnet }
      );
      const supportHistoryChainList = chainList.filter(
        (item) => item.is_support_history
      );
      setSupportHistoryChains(supportHistoryChainList);
      const historyQueue = new PQueue({ concurrency: 100 });
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
        protocolListRef.current = result;
      }
      result.forEach((item) => {
        if (supportHistoryChainList.some((i) => i.id === item.chain)) {
          historyQueue.add(async () => {
            const r = await requestOpenApiWithChainId(
              ({ openapi }) =>
                openapi.getHistoryProtocol({
                  addr,
                  id: item.id,
                  timeAt: YESTERDAY,
                }),
              { isTestnet: _isTestnet }
            );
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
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
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
        const tokenHistoryPriceQueue = new PQueue({ concurrency: 100 });
        const grouped = groupBy(noHistoryPriceTokenList, (item) => {
          return item.split('-')[0];
        });
        Object.keys(grouped).forEach((i) => {
          const l = grouped[i];
          tokenHistoryPriceQueue.add(async () => {
            const priceMap = await requestOpenApiWithChainId(
              ({ openapi }) =>
                openapi.getTokenHistoryDict({
                  chainId: i,
                  ids: l.map((s) => s.split('-')[1]).join(','),
                  timeAt: YESTERDAY,
                }),
              { isTestnet: _isTestnet }
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
        await waitQueueFinished(tokenHistoryPriceQueue);
      }
      if (addr === addressRef.current && _isTestnet === isTestnetRef.current) {
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
  }, [address, nonce, isTestnet]);

  useEffect(() => {
    protocolListRef.current = [];
    setHistoryProtocolMap({});
    setTokenHistoryPriceMap({});
    setHistoryTokenDict({});
    setIsLoading(false);
  }, [address, isTestnet]);

  useEffect(() => {
    if (!address) return;
    addressRef.current = address;
    isTestnetRef.current = isTestnet;
    fetchData(address, currentView, isTestnet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, nonce, currentView, isTestnet]);

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
