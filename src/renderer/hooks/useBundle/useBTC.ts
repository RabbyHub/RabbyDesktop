import React from 'react';
import Axios from 'axios';
import { INITIAL_OPENAPI_URL } from '@/renderer/utils/constant';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useBundleAccount } from './useBundleAccount';
import { saveBundleAccountsBalance } from './shared';
import { bigNumberSum } from './util';

let lastUpdatedKey = '';

/**
 * 调用 BTC API
 * 不存储数据，只负责调用 API
 */
export const useBTC = () => {
  const [balance, setBalance] = React.useState('0');
  const { inBundleList } = useBundleAccount();
  const btcAccounts = React.useMemo(
    () => inBundleList.filter((acc) => acc.type === 'btc') as BTCAccount[],
    [inBundleList]
  );
  const [assets, setAssets] = React.useState<TokenItem[]>();
  const [loading, setLoading] = React.useState(false);

  const updatedKey = React.useMemo(
    () => JSON.stringify(btcAccounts.map((acc) => acc.id)),
    [btcAccounts]
  );
  const getAssets = async (force = false) => {
    if (lastUpdatedKey === updatedKey && !force) {
      return;
    }
    setLoading(true);
    const result = await Promise.all(
      btcAccounts.map((account) => {
        return Axios.get<
          TokenItem & {
            total_usd_value: number;
          }
        >(`${INITIAL_OPENAPI_URL}/v1/user/btc_balance`, {
          params: {
            id: account.address,
          },
        }).then((res) => res.data);
      })
    );

    result.forEach((item) => {
      item.usd_value = item.total_usd_value;
    });

    setAssets(result);

    const balances = result.map((item) => item.usd_value);
    const updateAccounts = btcAccounts.map((account, index) => {
      return {
        ...account,
        balance: balances[index]?.toString(),
      };
    });

    // 持久化余额
    saveBundleAccountsBalance(updateAccounts);
    // 更新 bn 的总余额
    setBalance(bigNumberSum(...balances));
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
    loading,
  };
};
