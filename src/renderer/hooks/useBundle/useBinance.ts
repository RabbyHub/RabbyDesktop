import React from 'react';
import { saveBundleAccountsBalance } from './shared';
import { Binance } from './cex/binance/binance';
import { mergeList, bigNumberSum } from './util';
import { useBundleAccount } from './useBundleAccount';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

type BinanceAssets = Awaited<ReturnType<Binance['getAssets']>>;

export const useBinance = () => {
  const [balance, setBalance] = React.useState<string>('0');
  const [assets, setAssets] = React.useState<BinanceAssets[]>();
  const { binanceList } = useBundleAccount();
  const [mergedFundingAsset, setMergedFundingAsset] = React.useState<
    BinanceAssets['fundingAsset']
  >([]);
  const [mergedSpotAsset, setMergedSpotAsset] = React.useState<
    BinanceAssets['spotAsset']
  >([]);

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

    setAssets(result);

    // 计算合并资产
    const fundingAssets = result.flatMap((item) => item.fundingAsset);
    const spotAssets = result.flatMap((item) => item.spotAsset);

    setMergedFundingAsset(
      mergeList(fundingAssets, 'asset', ['usdtValue', 'value'])
    );
    setMergedSpotAsset(mergeList(spotAssets, 'asset', ['usdtValue', 'value']));

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
    setBalance(bigNumberSum(...balances));
  }, [bnAccounts]);

  // update when bnAccount list changed
  React.useEffect(() => {
    console.log('getAssets');
    getAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(bnIds)]);

  return {
    getAssets,
    mergedFundingAsset,
    mergedSpotAsset,
    balance,
    assets,
  };
};
