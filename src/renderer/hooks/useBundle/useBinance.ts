import { useAtom } from 'jotai';
import React from 'react';
import { bundleAccountsAtom } from './shared';
import { Binance } from './cex/binance/binance';
import { plusBigNumber } from './util';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

export const useBinance = () => {
  const [accounts] = useAtom(bundleAccountsAtom);
  const [balance, setBalance] = React.useState<string>('0');
  const [assets, setAssets] =
    React.useState<Awaited<ReturnType<Binance['getAssets']>>>();

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
    const result = await Promise.all(
      bnAccounts.map((account) => account.api.getAssets())
    );

    // TODO: plus results
    setAssets(result[0]);

    const balances = await Promise.all(
      bnAccounts.map((account) => account.api.getBalance())
    );

    setBalance(plusBigNumber(...balances));
  }, [bnAccounts]);

  return {
    getAssets,
    balance,
    assets,
  };
};
