import React from 'react';
import { useBundleAccount } from '../useBundleAccount';
import { useBinance } from './useBinance';
import { useOKX } from './useOKX';

// 交易所 Cex 列表
export const useCex = () => {
  const account = useBundleAccount();

  const binance = useBinance();
  const okx = useOKX();
  const cexList = React.useMemo(() => {
    const cexKey = [binance, okx];

    return cexKey.map((cex) => {
      const hasAccount = account.inBundleList.some(
        (acc) => acc.type === cex.type
      );
      return {
        type: cex.type,
        hasAccount,
        instance: cex,
      };
    });
  }, [account.inBundleList, binance, okx]);

  return { cexList, binance, okx };
};
