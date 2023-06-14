import React from 'react';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { atom, useAtom } from 'jotai';
import { sortBy } from 'lodash';
import { saveBundleAccountsBalance } from '../shared';
import { mergeList, bigNumberSum } from '../util';
import { useBundleAccount } from '../useBundleAccount';
import { DisplayProtocol } from '../../useHistoryProtocol';
import { ERROR } from '../error';
import { OKX } from '../cex/okx/okx';
import {
  toFinancePortfolioList,
  toFundingPortfolioList,
  toIsolatedMarginPortfolioList,
  toMarginPortfolio,
} from '../cex/okx/util';

type OkxAccountWithAPI = OkxAccount & {
  api: OKX;
};

type OkxAssets = Awaited<ReturnType<OKX['getAssets']>>;

const balanceAtom = atom<string>('0');
const assetsAtom = atom<OkxAssets[]>([]);
const mergedFundingAssetAtom = atom<OkxAssets['fundingAsset']>([]);
let lastUpdatedKey = '';

export const useOKX = () => {
  const [balance, setBalance] = useAtom(balanceAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const { inBundleList, okxList, remove } = useBundleAccount();
  const [mergedFundingAsset, setMergedFundingAsset] = useAtom(
    mergedFundingAssetAtom
  );
  const [loading, setLoading] = React.useState(false);

  const okxInBundleAccounts = React.useMemo<OkxAccount[]>(() => {
    return inBundleList.filter((acc) => acc.type === 'okx') as OkxAccount[];
  }, [inBundleList]);
  const OkxAccounts = React.useMemo<OkxAccountWithAPI[]>(() => {
    return okxList.map((item) => ({
      ...item,
      api: new OKX({
        apiKey: item.apiKey,
        apiSecret: item.apiSecret,
        passphrase: item.passphrase,
        nickname: item.nickname,
        simulated: item.simulated,
      }),
    }));
  }, [okxList]);

  const updatedKey = React.useMemo(
    () => JSON.stringify(okxInBundleAccounts.map((acc) => acc.id)),
    [okxInBundleAccounts]
  );

  const getAssetByAccount = async (account: OkxAccountWithAPI) => {
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
    const result = await Promise.all(OkxAccounts.map(getAssetByAccount));

    const inBundleAssets = result.filter((item, index) => {
      return (
        item &&
        okxInBundleAccounts.some((acc) => acc.id === OkxAccounts[index].id)
      );
    });
    setAssets(inBundleAssets);

    // 计算合并资产
    const fundingAssets = inBundleAssets.flatMap((item) => item.fundingAsset);

    setMergedFundingAsset(
      mergeList(fundingAssets, 'asset', ['usdtValue', 'value'])
    );

    const balances = await Promise.all(
      OkxAccounts.map((account) => account.api.getBalance())
    );

    const updateAccounts = OkxAccounts.map((account, index) => {
      return {
        ...account,
        balance: balances[index],
      };
    });

    // 持久化余额
    saveBundleAccountsBalance(updateAccounts);
    // 更新在 bundle 里的 okx 的总余额
    const inBundleBalances = okxInBundleAccounts.map((acc) => {
      return updateAccounts.find((item) => item.id === acc.id)?.balance ?? '0';
    });
    setBalance(bigNumberSum(...inBundleBalances));

    lastUpdatedKey = updatedKey;
    setLoading(false);
  };

  const chainData = {
    usd_value: Number(balance),
    id: OKX.cexName,
    // 假的 id
    community_id: 9000030,
    wrapped_token_id: OKX.cexName,
    name: OKX.cexName,
    native_token_id: OKX.cexName,
    logo_url: 'rabby-internal://assets/icons/bundle/okx.png',
  } as DisplayChainWithWhiteLogo & {
    usd_value: number;
  };

  // 把资产数据转换成 rabby 资产数据类型
  const protocolData = React.useMemo(() => {
    // 资金账户
    const fundingPortfolioList = toFundingPortfolioList(mergedFundingAsset);

    const otherPortfolioList =
      assets?.flatMap((item) => {
        // 全仓账户
        const marginPortfolio =
          item.marginAsset && toMarginPortfolio(item.marginAsset);

        // 逐仓账户
        const isolatedMarginList = toIsolatedMarginPortfolioList(
          item.isolatedMarginAsset
        );

        // 理财账户(Staking)
        const stakeList = toFinancePortfolioList(item.stakingAsset, 'Stake');

        // 理财账户(DeFi)
        const deFiList = toFinancePortfolioList(item.defiAsset, 'DeFi');

        // 余币宝
        const savingsList = toFinancePortfolioList(
          item.savingsAsset,
          'Savings'
        );

        return [
          ...stakeList,
          ...deFiList,
          ...savingsList,
          ...isolatedMarginList,
          ...(marginPortfolio ? [marginPortfolio] : []),
        ];
      }) ?? [];

    const data: DisplayProtocol = {
      usd_value: Number(balance),
      id: OKX.cexName,
      chain: OKX.cexName,
      name: OKX.cexName,
      site_url: '',
      logo_url: 'rabby-internal://assets/icons/bundle/okx.png',
      has_supported_portfolio: false,
      tvl: 0,
      portfolio_item_list: [...fundingPortfolioList, ...otherPortfolioList],
    };

    data.portfolio_item_list = sortBy(
      data.portfolio_item_list,
      (item) => item.stats.asset_usd_value
    );

    return data;
  }, [assets, balance, mergedFundingAsset]);

  return {
    getAssetByAccount,
    getAssets,
    mergedFundingAsset,
    balance,
    assets,
    chainData,
    protocolData,
    loading,
    type: 'okx' as const,
  };
};
