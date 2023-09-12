import { useCallback, useEffect, useMemo, useRef } from 'react';
import { atom, useAtom, useAtomValue } from 'jotai';
import * as Sentry from '@sentry/react';

import { Account, RabbyAccount } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import {
  MatteredChainBalancesType,
  formatAccountTotalBalance,
} from '@/isomorphic/wallet/balance';
import { Chain } from '@debank/common';
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

export function useReadAccountList() {
  return useAtomValue(accountsAtom);
}

export function useAccounts(opts?: {
  disableAutoFetch?: boolean;
  onFetchStageChanged?(ctx: {
    state: FetchAccountsState;
    accounts: AccountWithName[];
  }): void;
}) {
  const [accounts, setAccounts] = useAtom(accountsAtom);

  const { disableAutoFetch = false, onFetchStageChanged } = opts || {};

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
    if (!disableAutoFetch) {
      fetchAccounts();
    }
  }, [disableAutoFetch, fetchAccounts]);

  useMessageForwarded(
    {
      targetView: '*',
      type: 'refreshAccountList',
    },
    () => {
      fetchAccounts();
    }
  );

  return {
    accounts,
    fetchAccounts,
    isFinishedFetchAccounts: fetchAccountsState === FetchAccountsState.FINISHED,
  };
}

const matteredChainBalancesAtom = atom<MatteredChainBalancesType>({});
const testMatteredChainBalancesAtom = atom<MatteredChainBalancesType>({});
export function useAccountBalanceMap(options?: {
  accountAddress?: RabbyAccount['address'] | null;
  disableAutoFetch?: boolean;
  isTestnet?: boolean;
}) {
  let { accountAddress = '' } = options || {};
  const { disableAutoFetch = false } = options || {};

  const [currentAccount] = useAtom(currentAccountAtom);

  accountAddress = accountAddress || currentAccount?.address || null;

  const { isTestnet = false } = options || {};

  const mainnetMattered = useAtom(matteredChainBalancesAtom);
  const testnetMattered = useAtom(testMatteredChainBalancesAtom);

  const { matteredChainBalances, setMatteredChainBalances } = useMemo(() => {
    return {
      matteredChainBalances: !isTestnet
        ? mainnetMattered[0]
        : testnetMattered[0],
      setMatteredChainBalances: !isTestnet
        ? mainnetMattered[1]
        : testnetMattered[1],
    };
  }, [isTestnet, mainnetMattered, testnetMattered]);

  const fetchBalance = useCallback(async () => {
    if (!accountAddress) return;

    const triggerFetchP = walletController.getAddressBalance(
      accountAddress,
      true,
      isTestnet
    );
    let result = await walletController.getAddressCacheBalance(
      accountAddress,
      isTestnet
    );
    if (!result) {
      try {
        result = await triggerFetchP;
      } catch (error) {
        console.error(error);
      }
    }

    const fresult = formatAccountTotalBalance(result);

    setMatteredChainBalances(fresult.matteredChainBalances);
  }, [isTestnet, accountAddress, setMatteredChainBalances]);

  const getLocalBalanceValue = useCallback(
    (chainId: Chain['serverId']) => {
      return matteredChainBalances[chainId]?.usd_value || 0;
    },
    [matteredChainBalances]
  );

  useEffect(() => {
    if (!disableAutoFetch) {
      fetchBalance();
    }
  }, [disableAutoFetch, fetchBalance]);

  return {
    getLocalBalanceValue,
    matteredChainBalances,
    fetchBalance,
  };
}
