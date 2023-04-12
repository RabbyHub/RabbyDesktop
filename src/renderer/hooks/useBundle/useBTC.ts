import React from 'react';
import Axios from 'axios';
import { INITIAL_OPENAPI_URL } from '@/renderer/utils/constant';
import { useBundleAccount } from './useBundleAccount';
import { saveBundleAccountsBalance } from './shared';
import { bigNumberSum } from './util';

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

  const getAssets = React.useCallback(async () => {
    const balances = await Promise.all(
      btcAccounts.map((account) => {
        return Axios.get(`${INITIAL_OPENAPI_URL}/v1/user/btc_balance`, {
          params: {
            id: account.address,
          },
        }).then((res) => res.data.total_usd_value.toString());
      })
    );

    const updateAccounts = btcAccounts.map((account, index) => {
      return {
        ...account,
        balance: balances[index],
      };
    });

    // 持久化余额
    saveBundleAccountsBalance(updateAccounts);
    // 更新 bn 的总余额
    setBalance(bigNumberSum(...balances));
  }, [btcAccounts]);

  return {
    balance,
    getAssets,
  };
};
