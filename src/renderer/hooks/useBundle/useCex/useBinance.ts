import React from 'react';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { atom, useAtom } from 'jotai';
import { sortBy } from 'lodash';
import { saveBundleAccountsBalance } from '../shared';
import { Binance } from '../cex/binance/binance';
import { mergeList, bigNumberSum, valueGreaterThanThreshold } from '../util';
import { useBundleAccount } from '../useBundleAccount';
import { DisplayProtocol } from '../../useHistoryProtocol';
import {
  toFinancePortfolioList,
  toFundingPortfolioList,
  toFuturePortfolio,
  toIsolatedMarginPortfolioList,
  toMarginPortfolio,
  toSpotPortfolioList,
} from '../cex/binance/util';
import { ERROR } from '../error';

type BNAccountWithAPI = BNAccount & {
  api: Binance;
};

type BinanceAssets = Awaited<ReturnType<Binance['getAssets']>>;

const balanceAtom = atom<string>('0');
const assetsAtom = atom<BinanceAssets[]>([]);
const mergedFundingAssetAtom = atom<BinanceAssets['fundingAsset']>([]);
const mergedSpotAssetAtom = atom<BinanceAssets['spotAsset']>([]);
let lastUpdatedKey = '';

export const useBinance = () => {
  const [balance, setBalance] = useAtom(balanceAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const { inBundleList, binanceList, remove } = useBundleAccount();
  const [mergedFundingAsset, setMergedFundingAsset] = useAtom(
    mergedFundingAssetAtom
  );
  const [mergedSpotAsset, setMergedSpotAsset] = useAtom(mergedSpotAssetAtom);
  const [loading, setLoading] = React.useState(false);

  const bnInBundleAccounts = React.useMemo<BNAccount[]>(() => {
    return inBundleList.filter((acc) => acc.type === 'bn') as BNAccount[];
  }, [inBundleList]);
  const bnAccounts = React.useMemo<BNAccountWithAPI[]>(() => {
    return binanceList.map((item) => ({
      ...item,
      api: new Binance({
        apiKey: item.apiKey,
        apiSecret: item.apiSecret,
        nickname: item.nickname,
      }),
    }));
  }, [binanceList]);

  const updatedKey = React.useMemo(
    () => JSON.stringify(bnInBundleAccounts.map((acc) => acc.id)),
    [bnInBundleAccounts]
  );

  const getAssetByAccount = async (account: BNAccountWithAPI) => {
    try {
      const res = await account.api.getAssets();
      const _balance = account.api.getBalance();
      return {
        ...res,
        balance: _balance,
      };
    } catch (e: any) {
      if (e.message === ERROR.INVALID_KEY) {
        remove(account.id!);
      }
      throw e;
    }
  };

  const getAssets = async (force = false) => {
    if (lastUpdatedKey === updatedKey && !force) {
      return;
    }
    setLoading(true);
    // 获取所有资产，key 无效的直接删除并忽略结果
    const result = await Promise.all(bnAccounts.map(getAssetByAccount));

    const inBundleAssets = result.filter((item, index) => {
      return (
        item &&
        bnInBundleAccounts.some((acc) => acc.id === bnAccounts[index].id)
      );
    });
    setAssets(inBundleAssets);
    // 计算合并资产
    const fundingAssets = inBundleAssets.flatMap((item) => item.fundingAsset);
    const spotAssets = inBundleAssets.flatMap((item) => item.spotAsset);

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
    // 更新在 bundle 里的 bn 的总余额
    const inBundleBalances = bnInBundleAccounts.map((acc) => {
      return updateAccounts.find((item) => item.id === acc.id)?.balance ?? '0';
    });
    setBalance(bigNumberSum(...inBundleBalances));

    lastUpdatedKey = updatedKey;
    setLoading(false);
  };

  const chainData = {
    usd_value: Number(balance),
    id: Binance.cexName,
    // 假的 id
    community_id: 9000020,
    wrapped_token_id: Binance.cexName,
    name: Binance.cexName,
    native_token_id: Binance.cexName,
    logo_url: 'rabby-internal://assets/icons/bundle/binance-chain.png',
  } as DisplayChainWithWhiteLogo & {
    usd_value: number;
  };

  // 把币安资产数据转换成 rabby 资产数据类型
  const protocolData = React.useMemo(() => {
    // 资金账户
    const fundingPortfolio = toFundingPortfolioList(mergedFundingAsset);
    // 现货账户
    const spotPortfolio = toSpotPortfolioList(mergedSpotAsset);
    const otherPortfolioList =
      assets?.flatMap((item) => {
        const earnPortfolio = toFinancePortfolioList([
          ...item.financeAsset.flexible,
          ...item.financeAsset.stake,
          ...item.financeAsset.fixed,
        ]);
        // 全仓账户
        const marginPortfolio =
          item.marginAsset && toMarginPortfolio(item.marginAsset);
        // 逐仓账户
        const isolatedMargin = toIsolatedMarginPortfolioList(
          item.isolatedMarginAsset
        );
        // U本位合约
        const USDFuturePortfolio = toFuturePortfolio(
          item.usdFutures,
          'Futures(USD-M)'
        );
        // 币本位合约
        const TokenFuturePortfolio = toFuturePortfolio(
          item.tokenFutures,
          'Futures(COIN-M)'
        );
        const result = [...(marginPortfolio ? [marginPortfolio] : [])];
        if (earnPortfolio) {
          result.push(earnPortfolio);
        }
        if (isolatedMargin) {
          result.push(isolatedMargin);
        }
        if (item.usdFutures.length > 0) {
          result.push(USDFuturePortfolio);
        }
        if (item.tokenFutures.length > 0) {
          result.push(TokenFuturePortfolio);
        }
        return result;
      }) ?? [];

    const data: DisplayProtocol = {
      usd_value: Number(balance),
      id: Binance.cexName,
      chain: Binance.cexName,
      name: Binance.cexName,
      site_url: '',
      logo_url: 'rabby-internal://assets/icons/bundle/binance-chain.png',
      has_supported_portfolio: false,
      tvl: 0,
      portfolio_item_list: [...otherPortfolioList],
    };
    if (fundingPortfolio) {
      data.portfolio_item_list.push(fundingPortfolio);
    }
    if (spotPortfolio) {
      data.portfolio_item_list.push(spotPortfolio);
    }

    data.portfolio_item_list = sortBy(
      data.portfolio_item_list,
      (item) => item.stats.asset_usd_value
    );

    return data;
  }, [assets, balance, mergedFundingAsset, mergedSpotAsset]);

  return {
    getAssetByAccount,
    getAssets,
    mergedFundingAsset,
    mergedSpotAsset,
    balance,
    assets,
    chainData,
    protocolData,
    loading,
    type: 'bn' as const,
  };
};
