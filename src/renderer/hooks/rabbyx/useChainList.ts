import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { getChainList, updateChainStore } from '@/renderer/utils/chain';
import { useMount } from 'ahooks';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

export const chainListAtom = atom({
  mainnetList: getChainList('mainnet'),
  testnetList: getChainList('testnet'),
});

export const useChainList = () => {
  const [chainList] = useAtom(chainListAtom);

  return {
    ...chainList,
  };
};

export const useSyncChainList = () => {
  const [, setChainList] = useAtom(chainListAtom);

  useMount(() => {
    walletController.getMainnetListFromLocal().then((list) => {
      if (list?.length) {
        updateChainStore({
          mainnetList: list,
        });
        setChainList((prev) => ({
          ...prev,
          mainnetList: list,
        }));
      }
    });

    walletController.getCustomTestnetList().then((list) => {
      updateChainStore({
        testnetList: list || [],
      });
      setChainList((prev) => ({
        ...prev,
        testnetList: list || [],
      }));
    });
  });

  useEffect(() => {
    return window?.rabbyDesktop?.ipcRenderer?.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'syncChainList') {
          updateChainStore(payload.data || {});
          setChainList((prev) => ({
            ...prev,
            ...(payload.data || {}),
          }));
        }
      }
    );
  }, [setChainList]);
};
