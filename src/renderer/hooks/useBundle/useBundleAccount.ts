import { useAtom } from 'jotai';
import React from 'react';
import { Binance } from './cex/binance/binance';
import { bundleAccountsAtom } from './shared';
import { ERROR } from './error';

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);

  const checkAccount = (account: Partial<BundleAccount>) => {
    if (account.type === 'bn') {
      if (!account.apiKey || !account.apiSecret) {
        return {
          error: ERROR.INVALID_KEY,
        };
      }
    } else if (account.type === 'btc') {
      if (!account.address) {
        return {
          error: ERROR.INVALID_ADDRESS,
        };
      }
    } else if (account.type === 'eth') {
      if (!account.address) {
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
        if (acc.address === account.address) {
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
  };

  const createAccount = React.useCallback(async (account: BundleAccount) => {
    // check account
    if (account.type === 'bn') {
      // check permission
      const bn = new Binance(account.apiKey, account.apiSecret);
      try {
        await bn.checkPermission();
      } catch (error: any) {
        return {
          error: error.message,
        };
      }
    }
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-post', account);

    return account;
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

  const deleteAccount = React.useCallback((id: string) => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-delete', id);
  }, []);

  React.useEffect(() => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-init');

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:bundle:changed',
      (data) => {
        setAccounts(data.accounts ?? []);
      }
    );
  }, [setAccounts]);

  return {
    createAccount,
    updateNickname,
    deleteAccount,
    checkAccount,
    accounts,
  };
};
