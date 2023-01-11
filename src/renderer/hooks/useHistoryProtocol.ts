import { useState, useEffect } from 'react';
import PQueue from 'p-queue';
import BigNumber from 'bignumber.js';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { Protocol, ComplexProtocol } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';

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
  const [protocolList, setProtocolList] = useState<ComplexProtocol[]>([]);
  const [historyProtocolMap, setHistoryProtocolMap] = useState<
    Record<string, Protocol>
  >({});

  const fetchData = async (addr: string) => {
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const result: ComplexProtocol[] = [];
    const historyList: ComplexProtocol[] = [];
    const queue = new PQueue({ concurrency: 20 });
    protocolList.forEach((item) => {
      queue.add(() => walletOpenapi.getProtocol({ addr, id: item.id }));
    });
    queue.on('completed', (r: ComplexProtocol) => {
      if (r.portfolio_item_list.length > 0) {
        result.push(r);
      }
    });
    queue.once('empty', () => {
      const historyQueue = new PQueue({ concurrency: 20 });
      setProtocolList(result);
      result.forEach((item) => {
        if (LOAD_HISTORY_CHAIN_WHITELIST.includes(item.chain)) {
          historyQueue.add(() =>
            walletOpenapi.getHistoryProtocol({
              addr,
              id: item.id,
              timeAt: YESTERDAY,
            })
          );
        }
      });
      historyQueue.on('completed', (r: ComplexProtocol) => {
        historyList.push(r);
      });
      historyQueue.on('empty', () => {
        setHistoryProtocolMap(
          historyList.reduce((res, item) => {
            return {
              ...res,
              [item.id]: item,
            };
          }, {})
        );
      });
    });
  };

  useEffect(() => {
    if (!address) return;
    fetchData(address);
  }, [address]);

  return {
    protocolList,
    historyProtocolMap,
  };
};
