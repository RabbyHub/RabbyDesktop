import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import Safe from '@rabby-wallet/gnosis-sdk';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { useCurrentAccount } from './useAccount';

const pendingCountAtom = atom<number>(0);

export const useIsSafe = () => {
  const { currentAccount } = useCurrentAccount();

  return currentAccount?.type === KEYRING_CLASS.GNOSIS;
};

export const useSafe = () => {
  const [pendingCount, setPendingCount] = useAtom(pendingCountAtom);
  const { currentAccount } = useCurrentAccount();
  const isSafe = useIsSafe();
  const address = currentAccount!.address;

  const fetchPendingCount = React.useCallback(async () => {
    if (!isSafe) return 0;
    setPendingCount(0);
    const network = await walletController.getGnosisNetworkId(address);
    const txs = await Safe.getPendingTransactions(address, network);

    setPendingCount(txs.results.length);
  }, [address, isSafe, setPendingCount]);

  React.useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    pendingCount,
  };
};
