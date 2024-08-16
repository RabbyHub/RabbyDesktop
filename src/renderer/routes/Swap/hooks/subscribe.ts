import { isSameAddress } from '@/renderer/utils/address';
import { findChain } from '@/renderer/utils/chain';
import { CHAINS_ENUM } from '@debank/common';
import { Tx } from '@rabby-wallet/rabby-api/dist/types';
import { WrapTokenAddressMap } from '@rabby-wallet/rabby-swap';
import { atom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  activeProviderOriginAtom,
  activeSwapTxsAtom,
  refreshIdAtom,
} from '../atom';
import { postSwap, postSwapParams } from '../utils';

export function isSwapWrapToken(
  payTokenId: string,
  receiveId: string,
  chain: CHAINS_ENUM
) {
  const wrapTokens = [
    WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap],
    findChain({
      enum: chain,
    })?.nativeTokenAddress,
  ];
  return (
    !!wrapTokens.find((token) => token && isSameAddress(payTokenId, token)) &&
    !!wrapTokens.find((token) => token && isSameAddress(receiveId, token))
  );
}

export const refreshSwapTxListAtom = atom(0);

export const useRefreshSwapTxList = () => {
  const setReFreshSwapList = useSetAtom(refreshSwapTxListAtom);
  return useCallback(() => {
    setReFreshSwapList((e) => e + 1);
  }, [setReFreshSwapList]);
};

export const useOnSwapPushTx = (
  pushTxCb: (payload: Tx & { hash: string }) => void
) => {
  useEffect(
    () =>
      window.rabbyDesktop.ipcRenderer.on(
        '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
        (payload) => {
          if (payload.event !== 'transactionChanged') return;

          const { type, ...data } = payload.data || {};
          if (payload.data?.type === 'push-tx') {
            pushTxCb(data);
          }
        }
      ),
    [pushTxCb]
  );
};

export const useOnTxFinished = (
  cb: (payload: { success: boolean; hash: string }) => void
) => {
  useEffect(
    () =>
      window.rabbyDesktop.ipcRenderer.on(
        '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
        (payload) => {
          if (payload.event !== 'transactionChanged') return;

          if (payload.data?.type === 'finished') {
            cb(payload.data);
          }
        }
      ),
    [cb]
  );
};

export const usePostSwap = () => {
  const refreshSwapList = useRefreshSwapTxList();
  const pushTxs = useRef<Record<string, Tx & { hash: string }>>({});

  const localSwapTxs = useRef<Record<string, Omit<postSwapParams, 'tx'>>>({});

  const postSwapByChainHash = useCallback(
    async (key: string) => {
      if (localSwapTxs.current[key] && pushTxs.current[key]) {
        const data = pushTxs.current[key];
        const swapData = localSwapTxs.current[key];
        const { hash: _, ...tx } = data;
        const chain = findChain({
          serverId: swapData.payToken.chain,
        })?.enum;
        if (!chain) {
          return;
        }
        const isWrapSwap = isSwapWrapToken(
          swapData.payToken.id,
          swapData.receiveToken.id,
          chain
        );
        await postSwap({
          ...swapData,
          tx,
          dexId: isWrapSwap ? 'WrapToken' : swapData.dexId,
          slippage: isWrapSwap ? '0' : swapData.slippage,
        });

        delete pushTxs.current[key];
        delete localSwapTxs.current[key];
        refreshSwapList();
      }
    },
    [refreshSwapList]
  );

  const setData = useCallback(
    (d: Tx & { hash: string }) => {
      const key = `${d.chainId}-${d.hash.toLowerCase()}`;
      pushTxs.current = {
        ...pushTxs.current,
        [key]: d,
      };
      postSwapByChainHash(key);
    },
    [postSwapByChainHash]
  );
  useOnSwapPushTx(setData);

  const addSwapTx = useCallback(
    async (
      chain: CHAINS_ENUM,
      hash: string,
      swapData: Omit<postSwapParams, 'tx'>
    ) => {
      const key = `${findChain({ enum: chain })?.id}-${hash.toLowerCase()}`;
      localSwapTxs.current = {
        ...localSwapTxs.current,
        [key]: swapData,
      };
      postSwapByChainHash(key);
    },
    [postSwapByChainHash]
  );

  return addSwapTx;
};

export const useInSwap = () => {
  const location = useLocation();

  return useMemo(
    () => location.pathname === '/mainwin/swap',
    [location.pathname]
  );
};

export const useSwapOrApprovalLoading = () => {
  const refresh = useSetAtom(refreshIdAtom);
  const setActiveSwapTxs = useSetAtom(activeSwapTxsAtom);
  const setActiveProvider = useSetAtom(activeProviderOriginAtom);

  const subscribeTx = useCallback(
    (tx: string) => {
      setActiveSwapTxs((e) => [...e, tx]);
    },
    [setActiveSwapTxs]
  );

  const completeTx: Parameters<typeof useOnTxFinished>[0] = useCallback(
    (data) => {
      setActiveProvider((e) =>
        !e ? e : { ...e, activeLoading: false, activeTx: undefined }
      );
      setActiveSwapTxs((txs) =>
        txs.filter((tx) => tx.toLowerCase() !== data?.hash?.toLowerCase())
      );

      const timer: NodeJS.Timeout = setTimeout(() => {
        refresh();
      }, 1000);

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    },
    [refresh, setActiveProvider, setActiveSwapTxs]
  );

  useOnTxFinished(completeTx);

  return {
    subscribeTx,
  };
};
