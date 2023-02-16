import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { CHAINS } from '@debank/common';
import { useRequest } from 'ahooks';
import { minBy } from 'lodash';
import { useMemo } from 'react';

export const useTxSource = (address: string) => {
  const { data } = useRequest(() =>
    walletController.getTransactionHistory(address)
  );

  const dict = useMemo(() => {
    if (!data?.completeds) {
      return {};
    }
    const list = data.completeds.map((item) => {
      // const originTx = minBy(item.txs, (tx) => tx.createdAt);
      const completedTx = item.txs.find((tx) => tx.isCompleted);
      const chain = Object.values(CHAINS).find((i) => i.id === item.chainId);
      return {
        chain: chain?.serverId,
        hash: completedTx?.hash,
        origin: completedTx?.site?.origin,
      };
    });
    return list;
    // return [...data.completeds, ...data.pendings].reduce((acc, item) => {
    //   const originTx = minBy(item.txs, (tx) => tx.createdAt);
    //   if (
    //     originTx?.site?.origin &&
    //     /^https?:\/\//.test(originTx?.site?.origin)
    //   ) {
    //     acc[originTx.hash] = originTx.site.origin;
    //   }
    //   return acc;
    // }, {} as Record<string, string>);
  }, [data?.completeds]);

  console.log(dict);
  console.log(data);

  return dict;
};
