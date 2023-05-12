import { useCallback, useEffect, useRef, useState } from 'react';
import { atom, useAtom } from 'jotai';
import * as Sentry from '@sentry/react';

import { Account, RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
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

const enum FetchAccountsState {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  FINISHED = 'FINISHED',
}

const fetchAccountsAtom = atom<FetchAccountsState>(FetchAccountsState.IDLE);

export function useAccountFetchStage() {
  const [fetchAccountsState] = useAtom(fetchAccountsAtom);

  return {
    isFinishedFetchAccounts: fetchAccountsState === FetchAccountsState.FINISHED,
  };
}

export function useAccounts(opts?: {
  onFetchStageChanged(ctx: {
    state: FetchAccountsState;
    accounts: AccountWithName[];
  }): void;
}) {
  const [accounts, setAccounts] = useAtom(accountsAtom);

  const { onFetchStageChanged } = opts || {};

  const [fetchAccountsState, setAccountsFetchState] =
    useAtom(fetchAccountsAtom);
  const isFetchingRef = useRef(false);
  const fetchAccounts = useCallback(async () => {
    if (isFetchingRef.current) return;

    setAccountsFetchState(FetchAccountsState.PENDING);
    onFetchStageChanged?.({
      state: FetchAccountsState.PENDING,
      accounts: [],
    });
    isFetchingRef.current = true;

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
      setAccountsFetchState(FetchAccountsState.FINISHED);
      onFetchStageChanged?.({
        state: FetchAccountsState.FINISHED,
        accounts: nextAccounts,
      });
      isFetchingRef.current = false;
    }
  }, [onFetchStageChanged, setAccountsFetchState, setAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    fetchAccounts,
    isFinishedFetchAccounts: fetchAccountsState === FetchAccountsState.FINISHED,
  };
}
