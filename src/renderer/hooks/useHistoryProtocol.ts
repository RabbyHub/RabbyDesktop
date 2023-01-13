import { useState, useEffect, useRef } from 'react';
import PQueue from 'p-queue';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { ComplexProtocol } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

export const LOAD_HISTORY_CHAIN_WHITELIST = [
  CHAINS[CHAINS_ENUM.ETH].serverId,
  CHAINS[CHAINS_ENUM.BSC].serverId,
  CHAINS[CHAINS_ENUM.POLYGON].serverId,
  CHAINS[CHAINS_ENUM.OP].serverId,
  CHAINS[CHAINS_ENUM.AVAX].serverId,
  CHAINS[CHAINS_ENUM.GNOSIS].serverId,
  CHAINS[CHAINS_ENUM.ARBITRUM].serverId,
  CHAINS[CHAINS_ENUM.FTM].serverId,
  CHAINS[CHAINS_ENUM.CRO].serverId,
  CHAINS[CHAINS_ENUM.AURORA].serverId,
  CHAINS[CHAINS_ENUM.MOBM].serverId,
  CHAINS[CHAINS_ENUM.MOVR].serverId,
  CHAINS[CHAINS_ENUM.FUSE].serverId,
];

export interface DisplayProtocol extends ComplexProtocol {
  usd_value: number;
}

const getNoHistoryPriceTokensFromProtocolList = (
  protocolList: DisplayProtocol[],
  historyProtocolMap: Record<string, DisplayProtocol>
) => {
  const noHistoryPriceTokens = new Set<string>();
  protocolList
    .filter((item) => LOAD_HISTORY_CHAIN_WHITELIST.includes(item.chain))
    .forEach((item) => {
      if (!historyProtocolMap[item.id]) {
        item.portfolio_item_list.forEach((i) => {
          (i.detail.supply_token_list || []).forEach((token) => {
            noHistoryPriceTokens.add(`${token.chain}-${token.id}`);
          });
          (i.detail.borrow_token_list || []).forEach((token) => {
            noHistoryPriceTokens.add(`${token.chain}-${token.id}`);
          });
          (i.detail.reward_token_list || []).forEach((token) => {
            noHistoryPriceTokens.add(`${token.chain}-${token.id}`);
          });
        });
      } else {
        const currentTokenList: string[] = [];
        const historyTokenList: string[] = [];
        item.portfolio_item_list.forEach((i) => {
          (i.detail.supply_token_list || []).forEach((k) => {
            currentTokenList.push(`${k.chain}-${k.id}`);
          });
          (i.detail.borrow_token_list || []).forEach((k) => {
            currentTokenList.push(`${k.chain}-${k.id}`);
          });
          (i.detail.reward_token_list || []).forEach((k) => {
            currentTokenList.push(`${k.chain}-${k.id}`);
          });
        });
        historyProtocolMap[item.id].portfolio_item_list.forEach((i) => {
          (i.detail.supply_token_list || []).forEach((k) => {
            historyTokenList.push(`${k.chain}-${k.id}`);
          });
          (i.detail.borrow_token_list || []).forEach((k) => {
            historyTokenList.push(`${k.chain}-${k.id}`);
          });
          (i.detail.reward_token_list || []).forEach((k) => {
            historyTokenList.push(`${k.chain}-${k.id}`);
          });
        });
        currentTokenList.forEach((i) => {
          if (!historyTokenList.includes(i)) {
            noHistoryPriceTokens.add(i);
          }
        });
      }
    });
  return Array.from(noHistoryPriceTokens);
};

export default (address: string | undefined) => {
  const addressRef = useRef(address);
  const [protocolList, setProtocolList] = useState<DisplayProtocol[]>([]);
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

  const fetchData = async (addr: string) => {
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const result: DisplayProtocol[] = [];
    const historyList: DisplayProtocol[] = [];
    const queue = new PQueue({ concurrency: 20 });
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
    const waitQueueFinished = (q: PQueue) => {
      return new Promise((resolve) => {
        q.on('empty', () => {
          if (q.pending <= 0) resolve(null);
        });
      });
    };
    await waitQueueFinished(queue);
    const historyQueue = new PQueue({ concurrency: 20 });
    if (addr === addressRef.current) {
      setProtocolList(result);
    }
    result.forEach((item) => {
      if (LOAD_HISTORY_CHAIN_WHITELIST.includes(item.chain)) {
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
    const noHistoryPriceTokenList = getNoHistoryPriceTokensFromProtocolList(
      result,
      map
    );
    const tmap: Record<
      string,
      {
        price: number;
        id: string;
        chain: string;
      }
    > = {};
    const tokenHistoryPriceQueue = new PQueue({ concurrency: 20 });
    noHistoryPriceTokenList.forEach((i) => {
      tokenHistoryPriceQueue.add(async () => {
        const [chain, id] = i.split('-');
        const { price } = await walletOpenapi.getTokenHistoryPrice({
          chainId: chain,
          id,
          timeAt: YESTERDAY,
        });
        return {
          price,
          id,
          chain,
        };
      });
    });
    tokenHistoryPriceQueue.on(
      'completed',
      ({ price, id, chain }: { price: number; id: string; chain: string }) => {
        tmap[`${chain}-${id}`] = { price, chain, id };
      }
    );
    await waitQueueFinished(tokenHistoryPriceQueue);
    if (addr === addressRef.current) {
      setTokenHistoryPriceMap(tmap);
    }
  };

  useEffect(() => {
    if (!address) return;
    addressRef.current = address;
    setProtocolList([]);
    setHistoryProtocolMap({});
    fetchData(address);
  }, [address]);

  return {
    protocolList,
    historyProtocolMap,
    tokenHistoryPriceMap,
  };
};
