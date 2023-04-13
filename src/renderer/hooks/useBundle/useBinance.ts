import React from 'react';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { saveBundleAccountsBalance } from './shared';
import { Binance } from './cex/binance/binance';
import { mergeList, bigNumberSum } from './util';
import { useBundleAccount } from './useBundleAccount';
import { DisplayProtocol } from '../useHistoryProtocol';
import {
  toFinancePortfolioList,
  toFundingPortfolioList,
  toIsolatedMarginPortfolioList,
  toMarginPortfolio,
  toSpotPortfolioList,
} from './cex/binance/util';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

type BinanceAssets = Awaited<ReturnType<Binance['getAssets']>>;

let lastUpdatedKey = '';

export const useBinance = () => {
  const [balance, setBalance] = React.useState<string>('0');
  const [assets, setAssets] = React.useState<BinanceAssets[]>();
  const { inBundleList } = useBundleAccount();
  const [mergedFundingAsset, setMergedFundingAsset] = React.useState<
    BinanceAssets['fundingAsset']
  >([]);
  const [mergedSpotAsset, setMergedSpotAsset] = React.useState<
    BinanceAssets['spotAsset']
  >([]);

  const bnAccounts = React.useMemo<BNAccountWithAPI[]>(() => {
    const accounts = inBundleList.filter(
      (acc) => acc.type === 'bn'
    ) as BNAccount[];

    return accounts.map((item) => ({
      ...item,
      api: new Binance(item.apiKey, item.apiSecret),
    }));
  }, [inBundleList]);

  const updatedKey = React.useMemo(
    () => JSON.stringify(bnAccounts.map((acc) => acc.id)),
    [bnAccounts]
  );

  const getAssets = async (force = false) => {
    if (lastUpdatedKey === updatedKey && !force) {
      return;
    }
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

    lastUpdatedKey = updatedKey;
  };

  const chainData = {
    usd_value: Number(balance),
    id: 'binance',
    // 假的 id
    community_id: 9000020,
    wrapped_token_id: 'binance',
    name: 'Binance',
    native_token_id: 'binance',
    logo_url: 'rabby-internal://assets/icons/bundle/binance-chain.svg',
  } as DisplayChainWithWhiteLogo & {
    usd_value: number;
  };

  // 把币安资产数据转换成 rabby 资产数据类型
  const protocolData = React.useMemo(() => {
    // 资金账户
    const fundingPortfolioList = toFundingPortfolioList(mergedFundingAsset);
    // 现货账户
    const spotPortfolioList = toSpotPortfolioList(mergedSpotAsset);
    const otherPortfolioList =
      assets?.flatMap((item) => {
        // 理财账户(活期)
        const flexibleList = toFinancePortfolioList(
          item.financeAsset.flexible,
          'Flexible'
        );
        // 理财账户(Staking)
        const stakeList = toFinancePortfolioList(
          item.financeAsset.stake,
          'Stake'
        );
        // 理财账户(定期)
        const LockedList = toFinancePortfolioList(
          item.financeAsset.fixed,
          'Locked'
        );
        // 全仓账户
        const marginPortfolio = toMarginPortfolio(item.marginAsset);
        // 逐仓账户
        const isolatedMarginList = toIsolatedMarginPortfolioList(
          item.isolatedMarginAsset
        );

        return [
          ...flexibleList,
          ...LockedList,
          ...stakeList,
          marginPortfolio,
          ...isolatedMarginList,
        ];
      }) ?? [];

    const data: DisplayProtocol = {
      usd_value: Number(balance),
      id: 'binance',
      chain: '0',
      name: 'Binance',
      site_url: '',
      logo_url: 'rabby-internal://assets/icons/bundle/binance-chain.svg',
      has_supported_portfolio: false,
      tvl: 0,
      portfolio_item_list: [
        ...fundingPortfolioList,
        ...spotPortfolioList,
        ...otherPortfolioList,
      ],
    };

    return data;
  }, [assets, balance, mergedFundingAsset, mergedSpotAsset]);

  return {
    getAssets,
    mergedFundingAsset,
    mergedSpotAsset,
    balance,
    assets,
    chainData,
    protocolData,
  };
};
