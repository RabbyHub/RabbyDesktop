import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { useCurrentAccount } from './useAccount';

const DEBUG_DURACTION = 0;

export function useTransactionChanged() {
  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event !== 'transactionChanged') return;
        switch (payload.data?.type) {
          default:
            break;
          case 'push-failed': {
            message.open({
              type: 'error',
              content: 'Transaction push failed',
              className: 'rabbyx-tx-changed-tip',
              // duration: DEBUG_DURACTION,
            });
            break;
          }
          case 'submitted': {
            message.open({
              type: 'success',
              content: 'Transaction submitted',
              className: 'rabbyx-tx-changed-tip',
              // duration: DEBUG_DURACTION,
            });
            break;
          }
          case 'finished': {
            if (payload.data?.success) {
              message.open({
                type: 'success',
                content: 'Transaction success',
                className: 'rabbyx-tx-changed-tip',
                // duration: DEBUG_DURACTION,
              });
            } else {
              message.open({
                type: 'error',
                content: 'Transaction failed',
                className: 'rabbyx-tx-changed-tip',
                // duration: DEBUG_DURACTION,
              });
            }
            break;
          }
        }
      }
    );
  }, []);
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

  useEffect(() => {
    fetchCount();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event !== 'transactionChanged') return;

        fetchCount();
      }
    );
  }, [fetchCount]);

  return pendingTxCount;
}
