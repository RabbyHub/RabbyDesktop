import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { KEYRING_CLASS } from '@/renderer/utils/constant';
import Safe from '@rabby-wallet/gnosis-sdk';
import { atom, useAtom } from 'jotai';
import React from 'react';
import { useCurrentAccount } from './useAccount';

const pendingCountAtom = atom<number>(0);

export const useGnosis = () => {
  const [pendingCount, setPendingCount] = useAtom(pendingCountAtom);
  const { currentAccount } = useCurrentAccount();

  const fetchPendingCount = React.useCallback(async () => {
    const address = currentAccount!.address;
    console.log(currentAccount);
    const network = await walletController.getGnosisNetworkId(address);
    const txs = await Safe.getPendingTransactions(address, network);

    setPendingCount(txs.results.length);
  }, [currentAccount, setPendingCount]);

  React.useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    pendingCount,
  };
};

export const useIsGnosis = () => {
  const { currentAccount } = useCurrentAccount();

  return currentAccount?.type === KEYRING_CLASS.GNOSIS;
};
