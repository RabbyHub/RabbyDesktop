/// <reference path="../../../isomorphic/types-rabbyx.d.ts" />

import { atom, useAtom } from 'jotai';
import { useAsync } from 'react-use';
import { useCallback, useMemo } from 'react';
import { CHAINS_ENUM } from '@debank/common';
import { walletController } from '@/renderer/ipcRequest/rabbyx';

import type { DEX_ENUM } from '@rabby-wallet/rabby-swap';

export const swapAtom = atom<SwapState>({
  gasPriceCache: {},
  selectedChain: CHAINS_ENUM.ETH,
  selectedDex: null,
  unlimitedAllowance: false,
});

export const useSwap = () => {
  const [v, s] = useAtom(swapAtom);

  const getSwap = useCallback(
    async (key?: keyof SwapState) => {
      const data = await walletController.getSwap(key);
      s(key ? (e) => ({ ...e, key: data }) : { ...(data as SwapState) });
    },
    [s]
  );

  const { error, loading } = useAsync(getSwap);

  const updateMethod = useMemo(
    () => ({
      setSwapDexId: async (selectedDex: DEX_ENUM) => {
        await walletController.setSwapDexId(selectedDex);
        s((e) => ({ ...e, selectedDex }));
      },
      updateSwapGasCache: async (chainId: keyof GasCache, gas: ChainGas) => {
        await walletController.updateSwapGasCache(chainId, gas);
        await getSwap('gasPriceCache');
      },
      getLastTimeGasSelection: async (chain: CHAINS_ENUM) => {
        const gasCache = await walletController.getLastTimeGasSelection(chain);
        if (gasCache) {
          s((e) => ({
            ...e,
            gasPriceCache: {
              ...e.gasPriceCache,
              [chain]: gasCache,
            },
          }));
        }
        return gasCache;
      },
      setLastSelectedSwapChain: async (selectedChain: CHAINS_ENUM) => {
        await walletController.setLastSelectedSwapChain(selectedChain);
        s((e) => ({ ...e, selectedChain }));
      },
      setUnlimitedAllowance: async (unlimitedAllowance: boolean) => {
        await walletController.setUnlimitedAllowance(unlimitedAllowance);
        s((e) => ({ ...e, unlimitedAllowance }));
      },
    }),
    [getSwap, s]
  );

  return {
    swap: v,
    loading,
    error,
    ...updateMethod,
  };
};
