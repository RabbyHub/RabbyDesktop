import { atom, useAtom } from 'jotai';
import { useAsync } from 'react-use';
import { useCallback, useMemo } from 'react';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { walletController } from '@/renderer/ipcRequest/rabbyx';

import { DEX_ENUM, DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import type { ChainGas, GasCache, SwapState } from '@/isomorphic/types/rabbyx';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { obj2query } from '@/renderer/utils/url';

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
      getSwapGasCache: async (chain: CHAINS_ENUM) => {
        const gasCache = await walletController.getSwapGasCache(chain);
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

export const useGotoSwapByToken = () => {
  const navigate = useNavigate();

  const { swap } = useSwap();
  const { selectedDex } = swap;

  const gotoSwap = useCallback(
    (chain: string, payTokenId: string) => {
      if (
        selectedDex &&
        !DEX_SUPPORT_CHAINS[selectedDex]
          .map((e) => CHAINS[e].serverId)
          .includes(chain)
      ) {
        return message.info({
          content: 'The token on this chain is not supported on current dex',
          icon: (() => null) as any,
        });
      }
      return navigate(
        `/mainwin/swap?${obj2query({
          chain,
          payTokenId,
          rbisource: 'homeAsset',
        })}`
      );
    },
    [selectedDex, navigate]
  );
  return gotoSwap;
};
