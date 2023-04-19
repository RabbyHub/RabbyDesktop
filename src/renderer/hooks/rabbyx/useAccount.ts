import { useCallback, useEffect, useState } from 'react';
import { atom, useAtom } from 'jotai';
import * as Sentry from '@sentry/react';

import { Account, RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { useSubscribeRpm } from '@/renderer/hooks-shell/useShellWallet';
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

  const subscribeRpm = useSubscribeRpm();

  useEffect(() => {
    fetchCurrentAccount();

    return subscribeRpm((payload) => {
      switch (payload.event) {
        default:
          break;
        case 'unlock':
        case 'accountsChanged':
        case 'rabby:chainChanged': {
          fetchCurrentAccount();
        }
      }
    });
  }, [subscribeRpm, fetchCurrentAccount]);

  useMessageForwarded(
    {
      targetView: '*',
      type: 'refreshCurrentAccount',
    },
    () => {
      fetchCurrentAccount();
    }
  );

  return {
    switchAccount,
    fetchCurrentAccount,
    currentAccount,
  };
}

export function useAccounts() {
  const [accounts, setAccounts] = useAtom(accountsAtom);

  const [hasFetched, setHasFetched] = useState(false);
  const fetchAccounts = useCallback(async () => {
    setHasFetched(false);

    let nextAccounts: AccountWithName[] = [];
    try {
      nextAccounts = await walletController.getAccounts().then((list) => {
        return list.map((account) => {
          return {
            ...account,
            alianName: '',
          };
        });
      });

      await Promise.allSettled(
        nextAccounts.map(async (account, idx) => {
          const alianName = await getAliasNameByAddress(account.address);
          nextAccounts[idx] = {
            ...account,
            alianName,
          };
        })
      );
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      setAccounts(nextAccounts);
      setHasFetched(true);
    }
  }, [setAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    fetchAccounts,
    localHasFetched: hasFetched,
  };
}
