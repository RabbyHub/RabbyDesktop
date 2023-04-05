import { useAtom } from 'jotai';
import React from 'react';
import { bundleAccountsAtom } from './shared';
import { Binance } from './cex/binance/binance';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

export const useBinance = () => {
  const [accounts] = useAtom(bundleAccountsAtom);
  const bnAccounts = React.useMemo<BNAccountWithAPI[]>(() => {
    const result = accounts.filter(
      (account) => account.type === 'bn'
    ) as BNAccount[];

    return result.map((item) => ({
      ...item,
      api: new Binance(item.apiKey, item.apiSecret),
    }));
  }, [accounts]);

  const getAssets = React.useCallback(async () => {
    // 获取所有资产
    const list = await Promise.all(
      bnAccounts.map((account) => account.api.getAssets())
    );

    return list;
  }, [bnAccounts]);

  return {
    getAssets,
  };
};
