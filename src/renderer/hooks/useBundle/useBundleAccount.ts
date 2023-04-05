import { useAtom } from 'jotai';
import React from 'react';
import { Binance } from './cex/binance/binance';
import { bundleAccountsAtom } from './shared';

export const useBundleAccount = () => {
  const [accounts, setAccounts] = useAtom(bundleAccountsAtom);

  const postAccount = React.useCallback(async (account: BundleAccount) => {
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

  const putAccount = React.useCallback((account: BundleAccount) => {
    window.rabbyDesktop.ipcRenderer.invoke('bundle-account-put', account);
  }, []);

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
    postAccount,
    putAccount,
    deleteAccount,
    accounts,
  };
};
