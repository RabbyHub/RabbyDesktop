import type { DisplayedKeyring } from '@/isomorphic/types/rabbyx';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { sortAccountsByBalance } from '@/renderer/utils/account';
import { atom, useAtom } from 'jotai';
import PQueue from 'p-queue';
import React from 'react';
import { onBackgroundStoreChanged } from '@/renderer/utils/broadcastToUI';
import { useMessageForwarded } from '../useViewsMessage';

type IDisplayedAccount = Required<DisplayedKeyring['accounts'][number]>;
export type IDisplayedAccountWithBalance = IDisplayedAccount & {
  balance: number;
  byImport?: boolean;
  publicKey?: string;
};

const accountsListAtom = atom<IDisplayedAccountWithBalance[]>([]);
const loadingAtom = atom<boolean>(false);

export const useAccountToDisplay = () => {
  const [accountsList, setAccountsList] = useAtom(accountsListAtom);
  const [loadingAccounts, setLoading] = useAtom(loadingAtom);

  const getAllAccountsToDisplay = React.useCallback(async () => {
    if (loadingAccounts) return;
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
          try {
            let balance = await walletController.getAddressCacheBalance(
              item?.address
            );
            if (!balance) {
              balance = await walletController.getInMemoryAddressBalance(
                item?.address
              );
            }
            return {
              ...item,
              balance: balance?.total_usd_value || 0,
            };
          } catch (error) {
            console.error(error);
          }

          return { ...item, balance: 0 };
        })
    );

    setLoading(false);

    if (result) {
      const withBalanceList = sortAccountsByBalance(result);
      setAccountsList(withBalanceList);
    }
  }, [loadingAccounts, setAccountsList, setLoading]);

  const removeAccount = React.useCallback(
    async (payload: Parameters<typeof walletController.removeAddress>) => {
      setAccountsList((prev) => {
        return prev.filter((item) => {
          return !(
            item.address === payload[0] &&
            item.type === payload[1] &&
            item.brandName === payload[2]
          );
        });
      });
      getAllAccountsToDisplay();
    },
    [getAllAccountsToDisplay, setAccountsList]
  );

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
            console.log('accountsChanged');
            getAllAccountsToDisplay();
          }
        }
      }
    );
  }, [getAllAccountsToDisplay]);

  useMessageForwarded(
    {
      targetView: '*',
      type: 'refreshAccountList',
    },
    () => {
      getAllAccountsToDisplay();
    }
  );

  const updateBalance = React.useCallback(
    async (address: string) => {
      const balance = await walletController.getInMemoryAddressBalance(address);

      setAccountsList((prev) => {
        return prev.map((item) => {
          if (item.address === address) {
            return {
              ...item,
              balance: balance?.total_usd_value || 0,
            };
          }
          return item;
        });
      });

      return balance.total_usd_value;
    },
    [setAccountsList]
  );

  const updateAllBalance = React.useCallback(async () => {
    const queue = new PQueue({ concurrency: 10 });
    let hasError: Error | undefined;
    const result = await queue.addAll(
      (accountsList || []).map((item) => {
        return async () => {
          try {
            const balance = await walletController.getInMemoryAddressBalance(
              item.address
            );
            return {
              ...item,
              balance: balance?.total_usd_value || 0,
            };
          } catch (e: any) {
            hasError = e;
            return item;
          }
        };
      })
    );

    setAccountsList(result);

    if (hasError) {
      hasError.message = `updateAllBalance error: ${hasError.message}`;
      throw hasError;
    }
  }, [accountsList, setAccountsList]);

  return {
    accountsList,
    loadingAccounts,
    getAllAccountsToDisplay,
    removeAccount,
    updateBalance,
    updateAllBalance,
  };
};

type ChangedListener = Parameters<
  typeof onBackgroundStoreChanged<'contactBook'>
>[1];
export type MatcherFunc = (ctx: Parameters<ChangedListener>[0]) => boolean;
export function useRefreshAccountsOnContactBookChanged(
  matchAddress?: string | MatcherFunc,
  refresher?: () => void
) {
  React.useEffect(() => {
    if (!matchAddress) return;

    return onBackgroundStoreChanged('contactBook', (ctx) => {
      const matched =
        typeof matchAddress === 'function'
          ? !!matchAddress(ctx)
          : matchAddress === ctx.changedKey;
      if (matched) {
        refresher?.();
      }
    });
  }, [matchAddress, refresher]);
}
