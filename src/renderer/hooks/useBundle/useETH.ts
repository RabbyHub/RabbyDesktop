import React from 'react';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { formatChain, DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { useTotalBalance, calcAssetNetWorth } from '@/renderer/utils/balance';
import { atom, useAtom } from 'jotai';
import { useBundleAccount } from './useBundleAccount';
import {
  loadCachedTokenList,
  loadRealTimeTokenList,
} from '../useHistoryTokenList';
import { mergeList } from './util';
import {
  DisplayProtocol,
  loadCachedProtocolList,
  loadRealTimeProtocolList,
} from '../useHistoryProtocol';

const tokenListAtom = atom<TokenItem[]>([]);
const protocolListAtom = atom<DisplayProtocol[]>([]);
const usedChainListAtom = atom<DisplayChainWithWhiteLogo[]>([]);

let lastUpdatedKey = '';

export const useETH = () => {
  const [tokenList, setTokenList] = useAtom(tokenListAtom);
  const [protocolList, setProtocolList] = useAtom(protocolListAtom);
  const [usedChainList, setUsedChainList] = useAtom(usedChainListAtom);
  const { inBundleList } = useBundleAccount();
  const ethAccounts = React.useMemo(
    () => inBundleList.filter((acc) => acc.type === 'eth') as ETHAccount[],
    [inBundleList]
  );
  const updatedKey = React.useMemo(
    () => JSON.stringify(ethAccounts.map((acc) => acc.id)),
    [ethAccounts]
  );
  const [loadingProtocol, setLoadingProtocol] = React.useState(false);
  const [loadingToken, setLoadingToken] = React.useState(false);
  const [loadingUsedChain, setLoadingUsedChain] = React.useState(false);
  const [ethTokenBalanceMap, setEthTokenBalanceMap] = React.useState<
    Record<string, string>
  >({});
  const [ethProtocolBalanceMap, setEthProtocolBalanceMap] = React.useState<
    Record<string, string>
  >({});

  const balance = useTotalBalance(tokenList, protocolList);

  const getTokenList = async () => {
    const curUpdatedKey = lastUpdatedKey;
    setLoadingToken(true);
    const cachedListArray = await Promise.all(
      ethAccounts.map(async (acc) => {
        const list = await loadCachedTokenList(acc.data.address);
        setEthTokenBalanceMap({
          ...ethTokenBalanceMap,
          [acc.data.address.toLowerCase()]: calcAssetNetWorth(list, [], null),
        });
        return list;
      })
    );
    const cachedList = mergeList(
      cachedListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'amount']
    );
    setTokenList(cachedList);
    setLoadingToken(false);
    // const realTimeListArray = await Promise.all(
    //   ethAccounts.map(async (acc) => {
    //     const list = await loadRealTimeTokenList(acc.data.address);
    //     setEthTokenBalanceMap({
    //       ...ethTokenBalanceMap,
    //       [acc.data.address.toLowerCase()]: calcAssetNetWorth(list, [], null),
    //     });
    //     return list;
    //   })
    // );

    // if (curUpdatedKey !== lastUpdatedKey) {
    //   return;
    // }

    // const realTimeList = mergeList(
    //   realTimeListArray.reduce((prev, curr) => [...prev, ...curr], []),
    //   'id',
    //   ['usd_value', 'amount']
    // );
    // setTokenList(realTimeList);
  };

  const getProtocolList = async () => {
    const curUpdatedKey = lastUpdatedKey;
    setLoadingProtocol(true);
    const cachedListArray = await Promise.all(
      ethAccounts.map(async (acc) => {
        const protocols = await loadCachedProtocolList(acc.data.address);
        setEthProtocolBalanceMap({
          ...ethProtocolBalanceMap,
          [acc.data.address.toLowerCase()]: calcAssetNetWorth(
            [],
            protocols,
            null
          ),
        });
        return protocols;
      })
    );
    const cachedList = mergeList(
      cachedListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'portfolio_item_list']
    );

    setProtocolList(cachedList);
    setLoadingProtocol(false);
    // 顺序执行任务，最大并发数在函数内部控制
    // const realTimeListArray = [];
    // for (let i = 0; i < ethAccounts.length; i++) {
    //   const acc = ethAccounts[i];
    //   // eslint-disable-next-line no-await-in-loop
    //   const list = await loadRealTimeProtocolList(acc.data.address);
    //   setEthProtocolBalanceMap({
    //     ...ethProtocolBalanceMap,
    //     [acc.data.address.toLowerCase()]: calcAssetNetWorth([], list, null),
    //   });
    //   realTimeListArray.push(list);
    // }

    // if (curUpdatedKey !== lastUpdatedKey) {
    //   return;
    // }
    // const realTimeList = mergeList(
    //   realTimeListArray.reduce((prev, curr) => [...prev, ...curr], []),
    //   'id',
    //   ['usd_value', 'portfolio_item_list']
    // );
    // setProtocolList(realTimeList);
  };

  const getUsedChainList = async () => {
    setLoadingUsedChain(true);
    const listArray = await Promise.all(
      ethAccounts.map((acc) => walletOpenapi.usedChainList(acc.data.address))
    );

    const list = mergeList(
      listArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      []
    );
    setUsedChainList(list.map((chain) => formatChain(chain)));
    setLoadingUsedChain(false);
  };

  const getAssets = async (force = false) => {
    if (lastUpdatedKey === updatedKey && !force) {
      return;
    }
    lastUpdatedKey = updatedKey;
    getTokenList();
    getProtocolList();
    getUsedChainList();
  };

  const displayChainList = React.useMemo(() => {
    const map: Record<string, number> = {};
    protocolList.forEach((protocol) => {
      if (map[protocol.chain]) {
        map[protocol.chain] += protocol.usd_value;
      } else {
        map[protocol.chain] = protocol.usd_value;
      }
    });
    tokenList.forEach((token) => {
      if (map[token.chain]) {
        map[token.chain] += token.usd_value || 0;
      } else {
        map[token.chain] = token.usd_value || 0;
      }
    });
    const list = usedChainList.map((chain) => ({
      ...chain,
      usd_value: map[chain.id] || 0,
    }));
    return list;
  }, [usedChainList, protocolList, tokenList]);

  return {
    displayChainList,
    balance,
    loadingProtocol,
    loadingToken,
    loadingUsedChain,
    tokenList,
    protocolList,
    getAssets,
    ethTokenBalanceMap,
    ethProtocolBalanceMap,
  };
};
