import React from 'react';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useBundleAccount } from './useBundleAccount';
import {
  loadCachedTokenList,
  loadRealTimeTokenList,
} from '../useHistoryTokenList';
import { mergeList } from './util';

export const useETH = () => {
  const [tokenList, setTokenList] = React.useState<TokenItem[]>([]);
  const { inBundleList } = useBundleAccount();
  const ethAccounts = React.useMemo(
    () => inBundleList.filter((acc) => acc.type === 'eth') as ETHAccount[],
    [inBundleList]
  );
  const ethIds = React.useMemo(
    () => ethAccounts.map((acc) => acc.id),
    [ethAccounts]
  );
  const getTokenList = React.useCallback(async () => {
    // from cached
    const cachedListArray = await Promise.all(
      ethAccounts.map((acc) => loadCachedTokenList(acc.data.address))
    );
    const cachedList = mergeList(
      cachedListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value']
    );
    setTokenList(cachedList);

    // from api
    const realTimeListArray = await Promise.all(
      ethAccounts.map((acc) => loadRealTimeTokenList(acc.data.address))
    );
    const realTimeList = mergeList(
      realTimeListArray.reduce((prev, curr) => [...prev, ...curr], []),
      'id',
      ['usd_value']
    );
    setTokenList(realTimeList);
  }, [ethAccounts]);

  const getProtocolList = React.useCallback(async () => {
    // TODO
  }, []);

  const getAssets = React.useCallback(async () => {
    getTokenList();
  }, [getTokenList]);

  // update when ethAccounts list changed
  React.useEffect(() => {
    getAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ethIds)]);

  return {
    tokenList,
  };
};
