import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

export interface TokenWithHistoryItem {
  current: TokenItem;
  history: TokenItem;
}

const LOAD_HISTORY_CHAIN_WHITELIST = [
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
    const list = await walletOpenapi.listToken(addr);
    const q: TokenItem[] = [];
    setTokenList(
      list.map((item) => ({
        ...item,
        usd_value: new BigNumber(item.amount).times(item.price).toNumber(),
      }))
    );
    setIsLoading(false);
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
      } else if (LOAD_HISTORY_CHAIN_WHITELIST.includes(token.chain)) {
        q.push(token);
      }
    }
    try {
      const priceList = await Promise.all(
        q.map((item) =>
          walletOpenapi.getTokenHistoryPrice({
            chainId: item.chain,
            id: item.id,
            timeAt: YESTERDAY,
          })
        )
      );
      result.push(
        ...q.map((item, index) => ({
          ...item,
          price: priceList[index].price,
        }))
      );
    } catch (e) {
      // NOTHING
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
