import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { CHAINS } from '@debank/common';
import { useRequest } from 'ahooks';
import { useMemo } from 'react';

export const useTxSource = (address: string) => {
  const { data } = useRequest(() =>
    walletController.getTransactionHistory(address)
  );

  const dict = useMemo(() => {
    const map = new Map();
    if (!data?.completeds) {
      return map;
    }
    data.completeds.forEach((item) => {
      const completedTx = item.txs.find((tx) => tx.isCompleted);
      const chain = Object.values(CHAINS).find((i) => i.id === item.chainId);
      if (completedTx?.site) {
        map.set(
          [chain?.serverId, completedTx?.hash].join('|'),
          completedTx?.site
        );
      }
    });
    return map;
  }, [data?.completeds]);

  return dict;
};