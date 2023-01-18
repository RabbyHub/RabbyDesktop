import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { UsedChain } from '@debank/rabby-api/dist/types';
import { message } from 'antd';
import PQueue from 'p-queue';
import React from 'react';

export interface Account {
  address: string;
  balance?: number;
  index: number;
  chains?: UsedChain[];
  firstTxTime?: number;
  aliasName?: string;
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// cached chains, balance, firstTxTime
const cachedAccountInfo = new Map<string, Account>();

export const fetchAccountsInfo = async (accounts: Account[]) => {
  return Promise.all(
    accounts.map(async (account) => {
      let firstTxTime: number | undefined;
      let balance;
      const address = account.address?.toLowerCase();
      if (!address) return account;

      let needCache = true;

      if (cachedAccountInfo.has(address)) {
        const cached = cachedAccountInfo.get(address);
        if (cached) {
          return {
            ...account,
            chains: cached.chains,
            balance: cached.balance,
            firstTxTime: cached.firstTxTime,
          };
        }
      }

      let chains: Account['chains'];
      try {
        chains = await walletOpenapi.usedChainList(account.address);
      } catch (e) {
        console.error('ignore usedChainList error', e);
        needCache = false;
      }
      try {
        // if has chains, get balance from api
        if (chains?.length) {
          const res = await walletOpenapi.getTotalBalance(account.address);
          balance = res.total_usd_value;
        }
      } catch (e) {
        console.error('ignore getTotalBalance error', e);
        needCache = false;
      }

      // find firstTxTime
      chains?.forEach((chain: any) => {
        if (chain.born_at) {
          firstTxTime = Math.min(firstTxTime ?? Infinity, chain.born_at);
        }
      });

      const accountInfo: Account = {
        ...account,
        chains,
        balance,
        firstTxTime,
      };

      if (needCache) {
        cachedAccountInfo.set(address, accountInfo);
      }

      return accountInfo;
    })
  );
};

const useGetCurrentAccounts = ({ keyringId, keyring }: StateProviderProps) => {
  const [loading, setLoading] = React.useState(false);
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  const getCurrentAccounts = React.useCallback(async () => {
    setLoading(true);
    const result = (await walletController.requestKeyring(
      keyring,
      'getCurrentAccounts',
      keyringId
    )) as Account[];

    // fetch aliasName
    const accountsWithAliasName = await Promise.all(
      result.map(async (account) => {
        const aliasName = await walletController.getAlianName(account.address);
        account.aliasName = aliasName;
        return account;
      })
    );

    setAccounts(accountsWithAliasName);
    setLoading(false);
  }, []);

  const removeCurrentAccount = React.useCallback((address: string) => {
    setAccounts((result) => {
      return result.filter(
        (account) => !isSameAddress(account.address, address)
      );
    });
  }, []);

  const updateCurrentAccountAliasName = React.useCallback(
    (address: string, aliasName: string) => {
      setAccounts((result) => {
        return result.map((account) => {
          if (isSameAddress(account.address, address)) {
            account.aliasName = aliasName;
          }
          return account;
        });
      });
    },
    []
  );

  return {
    currentAccountsLoading: loading,
    getCurrentAccounts,
    currentAccounts: accounts,
    removeCurrentAccount,
    updateCurrentAccountAliasName,
  };
};

const useManagerTab = () => {
  const [tab, setTab] = React.useState<'ledger' | 'rabby'>('ledger');

  return {
    tab,
    setTab,
  };
};

const useHiddenInfo = () => {
  const [hiddenInfo, setHiddenInfo] = React.useState(true);
  return {
    hiddenInfo,
    setHiddenInfo,
  };
};

// !IMPORTANT!: Ledger instance only allow one request at a time,
// so we need a queue to control the request.
const useTaskQueue = () => {
  const queueRef = React.useRef(new PQueue({ concurrency: 1 }));

  const createTask = React.useCallback(async (task: () => Promise<any>) => {
    return queueRef.current.add(task);
  }, []);

  React.useEffect(() => {
    queueRef.current.on('error', (e) => {
      console.error(e);
      message.error({
        content:
          'Unable to connect to Hardware wallet. Please try to re-connect.',
        key: 'ledger-error',
      });
    });

    return () => {
      queueRef.current.clear();
    };
  }, []);

  return { queueRef, createTask };
};

export interface StateProviderProps {
  // FIXME:
  // it's not important, only one instance of ledger keyring will be created,
  // 'connectHardware' will not return keyringId if keyring already exists, so we
  // don't know the keyringId now.
  keyringId: number | null;
  keyring: string;
}

export const HDManagerStateContext = React.createContext<
  ReturnType<typeof useGetCurrentAccounts> &
    ReturnType<typeof useManagerTab> &
    ReturnType<typeof useHiddenInfo> &
    ReturnType<typeof useTaskQueue> &
    StateProviderProps
>({} as any);

export const HDManagerStateProvider: React.FC<
  StateProviderProps & {
    children?: React.ReactNode;
  }
> = ({ children, keyringId, keyring }) => {
  return (
    <HDManagerStateContext.Provider
      value={{
        ...useGetCurrentAccounts({ keyringId, keyring }),
        ...useManagerTab(),
        ...useHiddenInfo(),
        ...useTaskQueue(),
        keyringId,
        keyring,
      }}
    >
      {children}
    </HDManagerStateContext.Provider>
  );
};
