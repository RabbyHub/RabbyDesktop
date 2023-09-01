import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { CHAINS } from '@debank/common';
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
          // case 'push-failed': {
          //   showMainwinPopupview({
          //     type: 'right-side-popup',
          //     state: {
          //       type: 'failed',
          //       chain: payload.data.chain,
          //       title: 'Transaction push failed',
          //     },
          //   });

          //   break;
          // }
          // case 'submitted': {
          //   showMainwinPopupview({
          //     type: 'right-side-popup',
          //     state: {
          //       type: 'submit',
          //       chain: payload.data.chain,
          //       hash: payload.data.hash,
          //       title: 'Transaction submitted',
          //     },
          //   });

          //   break;
          // }
          case 'finished': {
            if (payload.data?.success) {
              showMainwinPopupview({
                type: 'right-side-popup',
                state: {
                  type: 'success',
                  chain: payload.data.chain,
                  hash: payload.data.hash,
                  title: 'Transaction completed',
                },
              });
            } else {
              showMainwinPopupview({
                type: 'right-side-popup',
                state: {
                  type: 'failed',
                  chain: payload.data.chain,
                  hash: payload.data.hash,
                  title: 'Transaction failed',
                },
              });
            }

            break;
          }
        }
      }
    );
  }, []);
}

export const pendingTxCountAtom = atom(0);
export const testnetPendingTxCountAtom = atom(0);

export function useTransactionPendingCount() {
  const { currentAccount } = useCurrentAccount();
  const [pendingTxCount, setPendingTxCount] = useAtom(pendingTxCountAtom);
  const [testnetPendingTxCount, setTestnetPendingTxCount] = useAtom(
    testnetPendingTxCountAtom
  );

  const fetchCount = useCallback(() => {
    if (!currentAccount?.address) {
      setPendingTxCount(0);
      return;
    }

    walletController
      .getTransactionHistory(currentAccount.address)
      .then(({ pendings }) => {
        const testnetPendings = pendings.filter((item) => {
          const chain = Object.values(CHAINS).find(
            (i) => i.id === item.chainId
          );
          return chain?.isTestnet;
        });
        setTestnetPendingTxCount(testnetPendings.length);
        setPendingTxCount(pendings.length - testnetPendings.length);
      });
  }, [currentAccount?.address, setPendingTxCount, setTestnetPendingTxCount]);

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

  return {
    pendingTxCount,
    testnetPendingTxCount,
    totalPendingTxCount: pendingTxCount + testnetPendingTxCount,
  };
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
