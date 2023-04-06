import { useAtom } from 'jotai';
import React from 'react';
import { bundleAccountsAtom } from './shared';
import { Binance } from './cex/binance/binance';
import { mergeList, plusBigNumber } from './util';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

type BinanceAssets = Awaited<ReturnType<Binance['getAssets']>>;

const mergeAssets = (assets: BinanceAssets[]) => {
  return assets.reduce((prev, curr) => {
    return {
      fundingAsset: mergeList(
        [...prev.fundingAsset, ...curr.fundingAsset],
        'asset',
        ['usdtValue', 'value']
      ),
      spotAsset: mergeList([...prev.spotAsset, ...curr.spotAsset], 'asset', [
        'usdtValue',
        'value',
      ]),
      // TODO
      marginAsset: undefined,
      isolatedMarginAsset: undefined,
      financeAsset: {
        fixed: mergeList(
          [...prev.financeAsset.fixed, ...curr.financeAsset.fixed],
          'asset',
          ['usdtValue', 'value']
        ),
        flexible: mergeList(
          [...prev.financeAsset.flexible, ...curr.financeAsset.flexible],
          'asset',
          ['usdtValue', 'value']
        ),
        stake: mergeList(
          [...prev.financeAsset.stake, ...curr.financeAsset.stake],
          'asset',
          ['usdtValue', 'value']
        ),
      },
    };
  }, assets[0]);
};

export const useBinance = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);
  const [balance, setBalance] = React.useState<string>('0');
  const [assets, setAssets] = React.useState<BinanceAssets>();

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

    // 更新 bn 余额
    setAccounts((prev) => {
      return prev.map((account) => {
        if (account.type === 'bn') {
          const index = bnAccounts.findIndex(
            (item) => item.apiKey === account.apiKey
          );

          return {
            ...account,
            balance: balances[index],
          };
        }

        return account;
      });
    });

    setBalance(plusBigNumber(...balances));
  }, [bnAccounts, setAccounts]);

  // update when bnAccounts changed
  React.useEffect(() => {
    console.log('getAssets');
    getAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bnAccounts]);

  return {
    getAssets,
    balance,
    assets,
  };
};
