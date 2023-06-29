import React from 'react';
import Axios from 'axios';
import { INITIAL_OPENAPI_URL } from '@/renderer/utils/constant';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { atom, useAtom } from 'jotai';
import { useBundleAccount } from './useBundleAccount';
import { saveBundleAccountsBalance } from './shared';
import { bigNumberSum } from './util';

const balanceAtom = atom<string>('0');
const assetsAtom = atom<TokenItem[]>([]);

let lastUpdatedKey = '';

/**
 * 调用 BTC API
 * 不存储数据，只负责调用 API
 */
export const useBTC = () => {
  const [balance, setBalance] = useAtom(balanceAtom);
  const [assets, setAssets] = useAtom(assetsAtom);
  const { inBundleList, btcList } = useBundleAccount();
  const btcInBundleAccounts = React.useMemo(
    () => inBundleList.filter((acc) => acc.type === 'btc') as BTCAccount[],
    [inBundleList]
  );
  const [loading, setLoading] = React.useState(false);

  const updatedKey = React.useMemo(
    () => JSON.stringify(btcInBundleAccounts.map((acc) => acc.id)),
    [btcInBundleAccounts]
  );

  const getAssetByAccount = (acc: BTCAccount) => {
    return Axios.get<
      TokenItem & {
        total_usd_value: number;
      }
    >(`${INITIAL_OPENAPI_URL}/v1/user/btc_balance`, {
      params: {
        id: acc.address,
      },
    })
      .then((res) => res.data)
      .then((res) => {
        res.usd_value = res.total_usd_value;
        return res;
      });
  };

  const getAssets = async (force = false) => {
    if (lastUpdatedKey === updatedKey && !force) {
      return;
    }
    setLoading(true);
    const result = await Promise.all(btcList.map(getAssetByAccount));

    setAssets(result);

    const balances = result.map((item) => item.usd_value);
    const updateAccounts = btcList.map((account, index) => {
      return {
        ...account,
        balance: balances[index]?.toString(),
      };
    });

    // 持久化余额
    saveBundleAccountsBalance(updateAccounts);
    // 更新在 bundle 里的 bn 的总余额
    const inBundleBalances = btcInBundleAccounts.map((acc) => {
      return updateAccounts.find((item) => item.id === acc.id)?.balance ?? '0';
    });
    setBalance(bigNumberSum(...inBundleBalances));

    lastUpdatedKey = updatedKey;
    setLoading(false);
  };

  const chainData = {
    usd_value: Number(balance),
    id: 'btc',
    // 假的 id
    community_id: 9000010,
    wrapped_token_id: 'btc',
    name: 'Bitcoin',
    native_token_id: 'btc',
    logo_url: 'rabby-internal://assets/icons/bundle/btc-chain.svg',
  } as DisplayChainWithWhiteLogo & {
    usd_value: number;
  };

  const tokenData = assets?.[0]
    ? ({
        ...assets?.[0],
        chain: 'btc',
        amount: assets?.reduce((acc, cur) => acc + cur.amount, 0),
        usd_value: assets?.reduce((acc, cur) => acc + (cur.usd_value ?? 0), 0),
      } as TokenItem)
    : undefined;

  return {
    balance,
    chainData,
    tokenData,
    getAssets,
    getAssetByAccount,
    loading,
  };
};
