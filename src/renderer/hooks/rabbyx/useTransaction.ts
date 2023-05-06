import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useCurrentAccount } from './useAccount';
import { useZPopupLayerOnMain } from '../usePopupWinOnMainwin';

const DEBUG_DURACTION = 0;

export function useTransactionChanged() {
  const ZActions = useZPopupLayerOnMain();

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event !== 'transactionChanged') return;
        switch (payload.data?.type) {
          default:
            break;
          case 'push-failed': {
            showMainwinPopup(
              { x: 0, y: 0 },
              {
                type: 'right-side-popup',
                state: {
                  type: 'failed',
                  chain: payload.data.chain,
                  title: 'Transaction push failed',
                },
              }
            );

            break;
          }
          case 'submitted': {
            showMainwinPopup(
              { x: 0, y: 0 },
              {
                type: 'right-side-popup',
                state: {
                  type: 'submit',
                  chain: payload.data.chain,
                  hash: payload.data.hash,
                  title: 'Transaction submitted',
                },
              }
            );

            break;
          }
          case 'finished': {
            if (payload.data?.success) {
              showMainwinPopup(
                { x: 0, y: 0 },
                {
                  type: 'right-side-popup',
                  state: {
                    type: 'success',
                    chain: payload.data.chain,
                    hash: payload.data.hash,
                    title: 'Transaction completed',
                  },
                }
              );
            } else {
              showMainwinPopup(
                { x: 0, y: 0 },
                {
                  type: 'right-side-popup',
                  state: {
                    type: 'failed',
                    chain: payload.data.chain,
                    hash: payload.data.hash,
                    title: 'Transaction failed',
                  },
                }
              );
            }

            break;
          }
        }
      }
    );
  }, [ZActions]);
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
        if (
          !['transactionChanged', 'clearPendingTransactions'].includes(
            payload.event
          )
        ) {
          return;
        }

        fetchCount();
      }
    );
  }, [fetchCount]);

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
