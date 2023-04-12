import React from 'react';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { formatChain, DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { sortBy } from 'lodash';
import { useTotalBalance } from '@/renderer/utils/balance';
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

let lastIdsKey: string | undefined;

export const useETH = () => {
  const [tokenList, setTokenList] = useAtom(tokenListAtom);
  const [protocolList, setProtocolList] = useAtom(protocolListAtom);
  const [usedChainList, setUsedChainList] = useAtom(usedChainListAtom);
  const { inBundleList } = useBundleAccount();
  const ethAccounts = React.useMemo(
    () => inBundleList.filter((acc) => acc.type === 'eth') as ETHAccount[],
    [inBundleList]
  );
  const ethIds = React.useMemo(
    () => ethAccounts.map((acc) => acc.id),
    [ethAccounts]
  );
  const [loadingProtocol, setLoadingProtocol] = React.useState(false);
  const [loadingToken, setLoadingToken] = React.useState(false);
  const [loadingUsedChain, setLoadingUsedChain] = React.useState(false);

  const totalBalance = useTotalBalance(tokenList, protocolList);

  const getTokenList = React.useCallback(async () => {
    setLoadingToken(true);
    const cachedListArray = await Promise.all(
      ethAccounts.map((acc) => loadCachedTokenList(acc.data.address))
    );
    const cachedList = mergeList(
      cachedListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'amount']
    );
    setTokenList(cachedList);
    setLoadingToken(false);
    const realTimeListArray = await Promise.all(
      ethAccounts.map((acc) => loadRealTimeTokenList(acc.data.address))
    );
    const realTimeList = mergeList(
      realTimeListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'amount']
    );
    setTokenList(realTimeList);
  }, [ethAccounts, setTokenList]);

  const getProtocolList = React.useCallback(async () => {
    setLoadingProtocol(true);
    const cachedListArray = await Promise.all(
      ethAccounts.map((acc) => loadCachedProtocolList(acc.data.address))
    );
    const cachedList = mergeList(
      cachedListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'portfolio_item_list']
    );

    setProtocolList(cachedList);
    setLoadingProtocol(false);
    // 顺序执行任务，最大并发数在函数内部控制
    const realTimeListArray = [];
    for (let i = 0; i < ethAccounts.length; i++) {
      const acc = ethAccounts[i];
      // eslint-disable-next-line no-await-in-loop
      const list = await loadRealTimeProtocolList(acc.data.address);
      realTimeListArray.push(list);
    }
    const realTimeList = mergeList(
      realTimeListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value', 'portfolio_item_list']
    );
    setProtocolList(realTimeList);
  }, [ethAccounts, setProtocolList]);

  const getUsedChainList = React.useCallback(async () => {
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
  }, [ethAccounts, setUsedChainList]);

  const getAssets = React.useCallback(async () => {
    getTokenList();
    getProtocolList();
    getUsedChainList();
  }, [getProtocolList, getTokenList, getUsedChainList]);

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
    return sortBy(list, (item) => item.usd_value).reverse();
  }, [usedChainList, protocolList, tokenList]);

  // update when ethAccounts list changed
  const idsKey = JSON.stringify(ethIds);
  React.useEffect(() => {
    if (lastIdsKey === idsKey) {
      return;
    }
    getAssets();
    lastIdsKey = idsKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return {
    displayChainList,
    totalBalance,
    loadingProtocol,
    loadingToken,
    loadingUsedChain,
    tokenList,
    protocolList,
    getAssets,
  };
};
