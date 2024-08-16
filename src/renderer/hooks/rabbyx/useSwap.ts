import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { CHAINS_ENUM } from '@debank/common';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { useAsync } from 'react-use';

import type { SwapState } from '@/isomorphic/types/rabbyx';
import { findChain } from '@/renderer/utils/chain';
import { obj2query } from '@/renderer/utils/url';
import { DEX_SUPPORT_CHAINS } from '@rabby-wallet/rabby-swap';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { DEX } from '@/renderer/routes/Swap/constant';

const supportedDEXListAtom = atom<string[]>(Object.keys(DEX));

supportedDEXListAtom.onMount = (setAtom) => {
  walletOpenapi.getSupportedDEXList().then(async (s) => {
    const data = await s;
    setAtom(data.dex_list);
  });
};

export const useSwapSupportedDexList = () => useAtom(supportedDEXListAtom);

export const swapAtom = atom<SwapState & { _loaded?: boolean }>({
  autoSlippage: true,
  slippage: '0.1',
  selectedChain: null,
  selectedFromToken: undefined,
  selectedToToken: undefined,
  preferMEVGuarded: false,
  _loaded: false,
});

const swapStateLoadedAtom = atom((get) => !!get(swapAtom)._loaded);

export const useSwapStateLoaded = () => useAtomValue(swapStateLoadedAtom);

swapAtom.onMount = (setAtom) => {
  walletController
    .getSwap()
    .then(async (s) => {
      const data = await s;
      setAtom({ ...data, _loaded: true });
    })
    .catch(() => {
      setAtom((preSwapData) => ({ ...preSwapData, _loaded: true }));
    });
};

export const useSwap = () => {
  const [v, s] = useAtom(swapAtom);

  const updateMethod = useMemo(
    () => ({
      setAutoSlippage: async (p: boolean) => {
        await walletController.setAutoSlippage(p);
        s((e) => ({ ...e, autoSlippage: p }));
      },

      setIsCustomSlippage: async (p: boolean) => {
        await walletController.setIsCustomSlippage(p);
        s((e) => ({ ...e, isCustomSlippage: p }));
      },
      setSlippage: async (p: string) => {
        await walletController.setSlippage(p);
        s((e) => ({ ...e, slippage: p }));
      },

      setSelectedFromToken: async (token?: TokenItem) => {
        await walletController.setSelectedFromToken(token);
        s((e) => ({ ...e, selectedFromToken: token }));
      },
      setSelectedToToken: async (token?: TokenItem) => {
        await walletController.setSelectedToToken(token);
        s((e) => ({ ...e, selectedToToken: token }));
      },
      setLastSelectedSwapChain: async (selectedChain: CHAINS_ENUM) => {
        await walletController.setLastSelectedSwapChain(selectedChain);
        s((e) => ({ ...e, selectedChain }));
      },

      setSwapPreferMEV: async (p: boolean) => {
        await walletController.setSwapPreferMEVGuarded(p);
        s((e) => ({ ...e, preferMEVGuarded: p }));
      },
    }),
    [s]
  );

  return {
    swap: v,
    loading: false,
    error: undefined,
    ...updateMethod,
  };
};

export const SWAP_SUPPORT_CHAINS = Array.from(
  new Set(Object.values(DEX_SUPPORT_CHAINS).flat())
);

export const useGotoSwapByToken = () => {
  const navigate = useNavigate();

  const gotoSwap = useCallback(
    (chain: string, payTokenId: string) => {
      if (
        SWAP_SUPPORT_CHAINS.map(
          (e) =>
            findChain({
              enum: e,
            })?.serverId
        ).includes(chain)
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
    [navigate]
  );
  return gotoSwap;
};
