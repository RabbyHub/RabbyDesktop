import { useAtom } from 'jotai';
import React from 'react';
import { Binance } from './cex/binance/binance';
import { bundleAccountsAtom } from './shared';
import { ERROR } from './error';
import { useAccountToDisplay } from '../rabbyx/useAccountToDisplay';

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);
  const { accountsList: ethAccountList, getAllAccountsToDisplay } =
    useAccountToDisplay();

  const preCheck = React.useCallback(
    async (account: Partial<BundleAccount>) => {
      console.log('check', account);
      if (account.type === 'bn') {
        if (!account.apiKey || !account.apiSecret) {
          return {
            error: ERROR.INVALID_KEY,
          };
        }

        const bn = new Binance(account.apiKey, account.apiSecret);
        try {
          await bn.checkPermission();
        } catch (error: any) {
          return {
            error: error.message,
          };
        }
      } else if (account.type === 'btc') {
        if (!account.address) {
          return {
            error: ERROR.INVALID_ADDRESS,
          };
        }
      } else if (account.type === 'eth') {
        if (!account.data?.address) {
          return {
            error: ERROR.INVALID_ADDRESS,
          };
        }
      }

      const result = accounts.find((acc) => {
        if (acc.type === 'bn' && account.type === 'bn') {
          if (acc.apiKey === account.apiKey) {
            return true;
          }
        } else if (acc.type === 'btc' && account.type === 'btc') {
          if (acc.address === account.address) {
            return true;
          }
        } else if (acc.type === 'eth' && account.type === 'eth') {
          if (acc.data.address === account.data?.address) {
            return true;
          }
        }
        return false;
      });

      if (result) {
        return {
          error: ERROR.EXISTED,
        };
      }

      return {
        error: null,
      };
    },
    [accounts]
  );

  const create = React.useCallback(
    async (account: BundleAccount) => {
      if ((await preCheck(account)).error) {
        return;
      }
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', account);

      return account;
    },
    [preCheck]
  );

  const addToBundle = React.useCallback(async (account: BundleAccount) => {
    // todo check account
    // update isBundle
  }, []);

  const updateNickname = React.useCallback(
    (id: BundleAccount['id'], nickname: BundleAccount['nickname']) => {
      const account = accounts.find((acc) => acc.id === id);
      if (!account) {
        return;
      }
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
        ...account,
        nickname,
      });
    },
    [accounts]
  );

  const remove = React.useCallback((id: string) => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-delete', id);
  }, []);

  // 初始化数据
  // 获取 bundle 账户和 eth 账户
  React.useEffect(() => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-init');
    getAllAccountsToDisplay();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:bundle:changed',
      (data) => {
        setAccounts(data.accounts ?? []);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAccounts]);

  const inBundleList = React.useMemo(() => {
    return accounts.filter((acc) => acc.inBundle);
  }, [accounts]);

  const binanceList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'bn') as BNAccount[];
  }, [accounts]);

  const btcList = React.useMemo(() => {
    return accounts.filter((acc) => acc.type === 'btc') as BTCAccount[];
  }, [accounts]);

  const ethList = React.useMemo(() => {
    return ethAccountList.map((acc) => {
      return {
        id: `${acc.type}.${acc.address}`,
        type: 'eth',
        nickname: acc.alianName,
        balance: acc.balance.toString(),
        data: acc,
      } as ETHAccount;
    });
  }, [ethAccountList]);

  return {
    create,
    remove,
    updateNickname,
    preCheck,
    inBundleList,
    binanceList,
    btcList,
    ethList,
  };
};
