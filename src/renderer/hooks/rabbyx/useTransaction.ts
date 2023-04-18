import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { useSubscribeRpm } from '@/renderer/hooks-shell/useShellWallet';
import { useCurrentAccount } from './useAccount';

const DEBUG_DURACTION = 0;

export function useTransactionChanged() {
  const subscribeRpm = useSubscribeRpm();

  useEffect(() => {
    subscribeRpm((payload) => {
      if (payload.event !== 'transactionChanged') return;
      switch (payload.data?.type) {
        default:
          break;
        case 'push-failed': {
          showMainwinPopupview({
            type: 'global-toast-popup',
            state: {
              toastType: 'toast-message',
              data: {
                type: 'error',
                content: 'Transaction push failed',
              },
            },
          });

          break;
        }
        case 'submitted': {
          showMainwinPopupview({
            type: 'global-toast-popup',
            state: {
              toastType: 'toast-message',
              data: {
                type: 'success',
                content: 'Transaction submitted',
              },
            },
          });

          break;
        }
        case 'finished': {
          if (payload.data?.success) {
            showMainwinPopupview({
              type: 'global-toast-popup',
              state: {
                toastType: 'toast-message',
                data: {
                  type: 'success',
                  content: 'Transaction success',
                },
              },
            });
          } else {
            showMainwinPopupview({
              type: 'global-toast-popup',
              state: {
                toastType: 'toast-message',
                data: {
                  type: 'error',
                  content: 'Transaction failed',
                },
              },
            });
          }

          break;
        }
      }
    });
  }, [subscribeRpm]);
}

const pendingTxCountAtom = atom(0);
export function useTransactionPendingCount() {
  const { currentAccount } = useCurrentAccount();
  const [pendingTxCount, setPendingTxCount] = useAtom(pendingTxCountAtom);

  const fetchCount = useCallback(() => {
    if (!currentAccount?.address) {
      setPendingTxCount(0);
      return;
    }

    walletController
      .getTransactionHistory(currentAccount.address)
      .then(({ pendings }) => {
        setPendingTxCount(pendings.length);
      });
  }, [currentAccount?.address, setPendingTxCount]);

  const subscribeRpm = useSubscribeRpm();

  useEffect(() => {
    fetchCount();

    return subscribeRpm((payload) => {
      if (
        !['transactionChanged', 'clearPendingTransactions'].includes(
          payload.event
        )
      ) {
        return;
      }

      fetchCount();
    });
  }, [subscribeRpm, fetchCount]);

  return pendingTxCount;
}

export const useClearPendingTx = () => {
  const { currentAccount } = useCurrentAccount();

  const clearPendingTx = useCallback(async () => {
    if (currentAccount?.address) {
      await walletController.clearAddressPendingTransactions(
        currentAccount?.address
      );
      message.success({
        content: 'Pending transaction cleared',
      });
    }
  }, [currentAccount?.address]);

  return clearPendingTx;
};
