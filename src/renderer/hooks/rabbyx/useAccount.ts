import { Account, RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { useMessageForwarded } from '../useViewsMessage';

type AccountWithName = Account & { alianName: string };
const currentAccountAtom = atom<
  null | (RabbyAccount & { alianName: string; balance?: number })
>(null);
const accountsAtom = atom<AccountWithName[]>([]);

async function getAliasNameByAddress(address: string) {
  return walletController.getAlianName(address);
}

export function useCurrentAccount() {
  const [currentAccount, setCurrentAccount] = useAtom(currentAccountAtom);

  const fetchCurrentAccount = useCallback(async () => {
    return walletController.getCurrentAccount().then(async (account) => {
      let alianName = '';
      if (account?.address) {
        alianName = await getAliasNameByAddress(account.address);
      }
      if (!('balance' in account)) {
        (account as any).balance =
          (await walletController.getAddressBalance(account?.address))
            .total_usd_value ?? 0;
      }
      setCurrentAccount((pre) => {
        return {
          ...pre,
          ...account,
          alianName,
        };
      });
    });
  }, [setCurrentAccount]);

  const switchAccount = useCallback(
    async (account: RabbyAccount | Account) => {
      await walletController.changeAccount(account);

      fetchCurrentAccount();
    },
    [fetchCurrentAccount]
  );

  useEffect(() => {
    fetchCurrentAccount();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'unlock':
          case 'accountsChanged':
          case 'rabby:chainChanged': {
            fetchCurrentAccount();
          }
        }
      }
    );
  }, [fetchCurrentAccount]);

  useMessageForwarded('*', 'refreshCurrentAccount', () => {
    fetchCurrentAccount();
  });

  return {
    switchAccount,
    fetchCurrentAccount,
    currentAccount,
  };
}

export function useAccounts() {
  const [accounts, setAccounts] = useAtom(accountsAtom);

  const hasFetchedRef = useRef(false);
  const fetchAccounts = useCallback(() => {
    walletController.getAccounts().then(async (newVal) => {
      const nextAccounts = await Promise.all(
        newVal.map(async (account) => {
          const alianName = await getAliasNameByAddress(account.address);
          return {
            ...account,
            alianName,
          };
        })
      );

      hasFetchedRef.current = true;
      setAccounts(nextAccounts);
    });
  }, [setAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    fetchAccounts,
    hasFetched: hasFetchedRef.current,
  };
}
