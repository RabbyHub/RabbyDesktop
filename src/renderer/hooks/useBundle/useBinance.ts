import React from 'react';
import { saveBundleAccountsBalance } from './shared';
import { Binance } from './cex/binance/binance';
import { mergeList, plusBigNumber } from './util';
import { useBundleAccount } from './useBundleAccount';

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
  const [balance, setBalance] = React.useState<string>('0');
  const [assets, setAssets] = React.useState<BinanceAssets>();
  const { binanceList } = useBundleAccount();

  const bnAccounts = React.useMemo<BNAccountWithAPI[]>(() => {
    return binanceList.map((item) => ({
      ...item,
      api: new Binance(item.apiKey, item.apiSecret),
    }));
  }, [binanceList]);
  const bnIds = React.useMemo(
    () => bnAccounts.map((item) => item.id),
    [bnAccounts]
  );

  const getAssets = React.useCallback(async () => {
    // 获取所有资产
    const result = await Promise.all(
      bnAccounts.map((account) => account.api.getAssets())
    );

    setAssets(mergeAssets(result));

    const balances = await Promise.all(
      bnAccounts.map((account) => account.api.getBalance())
    );

    const updateAccounts = bnAccounts.map((account, index) => {
      return {
        ...account,
        balance: balances[index],
      };
    });

    // 持久化余额
    saveBundleAccountsBalance(updateAccounts);
    // 更新 bn 的总余额
    setBalance(plusBigNumber(...balances));
  }, [bnAccounts]);

  // update when bnAccount list changed
  React.useEffect(() => {
    getAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bnIds)]);

  return {
    getAssets,
    balance,
    assets,
  };
};
