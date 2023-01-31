import type { DisplayedKeyring } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { sortAccountsByBalance } from '@/renderer/utils/account';
import { atom, useAtom } from 'jotai';
import React from 'react';

type IDisplayedAccount = Required<DisplayedKeyring['accounts'][number]>;
export type IDisplayedAccountWithBalance = IDisplayedAccount & {
  balance: number;
  byImport?: boolean;
};

const accountsListAtom = atom<IDisplayedAccountWithBalance[]>([]);
const loadingAtom = atom<boolean>(false);

export const useAccountToDisplay = () => {
  const [accountsList, setAccountsList] = useAtom(accountsListAtom);
  const [loadingAccounts, setLoading] = useAtom(loadingAtom);

  const getAllAccountsToDisplay = React.useCallback(async () => {
    setLoading(true);

    const [displayedKeyrings, allAlianNames] = await Promise.all([
      walletController.getAllVisibleAccounts(),
      walletController.getAllAlianNameByMap(),
    ]);

    const result = await Promise.all<IDisplayedAccountWithBalance>(
      displayedKeyrings
        .map((item) => {
          return item.accounts.map((account) => {
            return {
              ...account,
              address: account.address.toLowerCase(),
              type: item.type,
              byImport: item.byImport,
              alianName: allAlianNames[account?.address?.toLowerCase()]?.name,
              keyring: item.keyring,
            };
          });
        })
        .flat(1)
        .map(async (item) => {
          let balance = await walletController.getAddressCacheBalance(
            item?.address
          );
          if (!balance) {
            balance = await walletController.getAddressBalance(item?.address);
          }
          return {
            ...item,
            balance: balance?.total_usd_value || 0,
          };
        })
    );

    setLoading(false);

    if (result) {
      const withBalanceList = sortAccountsByBalance(result);
      setAccountsList(withBalanceList);
    }
  }, [setAccountsList, setLoading]);

  React.useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'unlock':
          case 'accountsChanged':
          case 'rabby:chainChanged': {
            console.log('init');
          }
        }
      }
    );
  }, []);

  return { accountsList, loadingAccounts, getAllAccountsToDisplay };
};
