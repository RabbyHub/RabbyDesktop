import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { findChain } from '@/renderer/utils/chain';
import { CHAINS } from '@debank/common';
import { useRequest } from 'ahooks';
import { useMemo } from 'react';

export const useTxSource = (address: string) => {
  const { data } = useRequest(
    () => walletController.getTransactionHistory(address),
    {
      refreshDeps: [address],
    }
  );

  const dict = useMemo(() => {
    const map = new Map<string, string>();
    if (!data?.completeds) {
      return map;
    }
    data.completeds.forEach((item) => {
      const completedTx = item.txs.find((tx) => tx.isCompleted);
      const chain = findChain({
        id: item.chainId,
      });
      if (
        completedTx?.site?.origin &&
        !completedTx?.site?.origin.startsWith('chrome-extension://')
      ) {
        map.set(
          [chain?.serverId, completedTx?.hash].join('|'),
          completedTx?.site?.origin
        );
      }
    });
    return map;
  }, [data?.completeds]);

  return dict;
};
