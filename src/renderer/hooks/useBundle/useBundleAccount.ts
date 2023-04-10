import { useAtom } from 'jotai';
import React from 'react';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Binance } from './cex/binance/binance';
import { bundleAccountsAtom } from './shared';
import { ERROR } from './error';
import { useAccountToDisplay } from '../rabbyx/useAccountToDisplay';

const { nanoid } = require('nanoid');

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);
  const { accountsList: ethAccountList, getAllAccountsToDisplay } =
    useAccountToDisplay();

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
        inBundle: accounts.some((account) => {
          return (
            account.type === 'eth' &&
            account.data.address === acc.address &&
            account.inBundle
          );
        }),
      } as ETHAccount;
    });
  }, [accounts, ethAccountList]);

  const preCheck = React.useCallback(
    async (account: Partial<BundleAccount>) => {
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
    async (account: Partial<BundleAccount>) => {
      if ((await preCheck(account)).error) {
        return;
      }
      let nickname = account.nickname || '';

      if (!nickname) {
        let num = 1;
        if (account.type === 'bn') {
          nickname = 'Binance';
          num = binanceList.length + 1;
        } else if (account.type === 'btc') {
          nickname = 'BTC';
          num = btcList.length + 1;
        }
        nickname += ` ${num}`;
      }
      const newAccount: BundleAccount = {
        id: nanoid(),
        ...(account as BundleAccount),
        nickname,
      };
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', newAccount);

      return newAccount;
    },
    [binanceList.length, btcList.length, preCheck]
  );

  const toggleBundle = React.useCallback(
    async (account: BundleAccount) => {
      const existed = accounts.find((acc) => acc.id === account.id);

      if (existed) {
        window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
          ...account,
          inBundle: !account.inBundle,
        });
        return;
      }
      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', {
        ...account,
        inBundle: true,
      });
    },
    [accounts]
  );

  const updateNickname = React.useCallback(
    async (id: BundleAccount['id'], nickname: BundleAccount['nickname']) => {
      const account = accounts.find((acc) => acc.id === id);
      if (!account) {
        return;
      }

      if (account.type === 'eth') {
        await walletController.updateAlianName(account.data.address, nickname);
        await getAllAccountsToDisplay();
        account.data.alianName = nickname;
      }

      window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', {
        ...account,
        nickname,
      });
    },
    [accounts, getAllAccountsToDisplay]
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

  return {
    create,
    remove,
    updateNickname,
    preCheck,
    inBundleList,
    binanceList,
    btcList,
    ethList,
    toggleBundle,
  };
};