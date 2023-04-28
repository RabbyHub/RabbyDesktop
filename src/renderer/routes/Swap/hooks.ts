import { isSameAddress } from '@/renderer/utils/address';
import { ValidateTokenParam } from '@/renderer/utils/token';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM, WrapTokenAddressMap } from '@rabby-wallet/rabby-swap';
import {
  decodeCalldata,
  DecodeCalldataResult,
  QuoteResult,
} from '@rabby-wallet/rabby-swap/dist/quote';
import BigNumber from 'bignumber.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tx } from '@debank/rabby-api/dist/types';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useLocation } from 'react-router-dom';
import { getRouter, getSpender, postSwap, postSwapParams } from './utils';
import {
  activeProviderOriginAtom,
  activeSwapTxsAtom,
  refreshIdAtom,
} from './atom';

export function isSwapWrapToken(
  payTokenId: string,
  receiveId: string,
  chain: CHAINS_ENUM
) {
  const wrapTokens = [
    WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap],
    CHAINS[chain].nativeTokenAddress,
  ];
  return (
    !!wrapTokens.find((token) => isSameAddress(payTokenId, token)) &&
    !!wrapTokens.find((token) => isSameAddress(receiveId, token))
  );
}

export const useVerifyRouterAndSpender = (
  chain: CHAINS_ENUM,
  dexId: DEX_ENUM,
  router?: string,
  spender?: string,
  payTokenId?: string,
  receiveTokenId?: string
) => {
  const data = useMemo(() => {
    if (dexId === DEX_ENUM.WRAPTOKEN) {
      return [true, true];
    }
    if (!dexId || !router || !spender || !payTokenId || !receiveTokenId) {
      return [true, true];
    }
    const routerWhitelist = getRouter(dexId, chain);
    const spenderWhitelist = getSpender(dexId, chain);
    const isNativeToken = isSameAddress(
      payTokenId,
      CHAINS[chain].nativeTokenAddress
    );
    const isWrapTokens = isSwapWrapToken(payTokenId, receiveTokenId, chain);

    return [
      isSameAddress(routerWhitelist, router),
      isNativeToken || isWrapTokens
        ? true
        : isSameAddress(spenderWhitelist, spender),
    ];
  }, [chain, dexId, payTokenId, receiveTokenId, router, spender]);
  return data;
};

export const useVerifyCalldata = <
  T extends Parameters<typeof decodeCalldata>[1]
>(
  data: QuoteResult | null,
  dexId: DEX_ENUM | null,
  slippage: string | number,
  tx?: T
) => {
  const callDataResult = useMemo(() => {
    if (dexId && dexId !== DEX_ENUM.WRAPTOKEN && tx) {
      try {
        return decodeCalldata(dexId, tx) as DecodeCalldataResult;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [dexId, tx]);

  const result = useMemo(() => {
    if (slippage && callDataResult && data) {
      const estimateMinReceive = new BigNumber(data.toTokenAmount).times(
        new BigNumber(1).minus(slippage)
      );

      return (
        isSameAddress(callDataResult.fromToken, data.fromToken) &&
        callDataResult.fromTokenAmount === data.fromTokenAmount &&
        isSameAddress(callDataResult.toToken, data.toToken) &&
        new BigNumber(callDataResult.minReceiveToTokenAmount)
          .minus(estimateMinReceive)
          .div(estimateMinReceive)
          .abs()
          .lte(0.05)
      );
    }
    return true;
  }, [callDataResult, data, slippage]);

  return result;
};

type VerifySdkParams<T extends ValidateTokenParam> = {
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
  slippage: string | number;
  data: QuoteResult | null;
  payToken: T;
  receiveToken: T;
};

export const useVerifySdk = <T extends ValidateTokenParam>(
  p: VerifySdkParams<T>
) => {
  const { chain, dexId, slippage, data, payToken, receiveToken } = p;

  const isWrapTokens = isSwapWrapToken(payToken.id, receiveToken.id, chain);
  const actualDexId = isWrapTokens ? DEX_ENUM.WRAPTOKEN : dexId;

  const [routerPass, spenderPass] = useVerifyRouterAndSpender(
    chain,
    actualDexId,
    data?.tx?.to,
    data?.spender,
    payToken?.id,
    receiveToken?.id
  );

  const callDataPass = useVerifyCalldata(
    data,
    actualDexId,
    new BigNumber(slippage).div(100).toFixed(),
    data?.tx ? { ...data?.tx, chainId: CHAINS[chain].id } : undefined
  );

  return {
    isSdkDataPass: routerPass && spenderPass && callDataPass,
  };
};

export const refreshSwapTxListAtom = atom(0);
export const useRefreshSwapTxList = () => {
  const setReFreshSwapList = useSetAtom(refreshSwapTxListAtom);
  return useCallback(() => {
    setReFreshSwapList((e) => e + 1);
  }, [setReFreshSwapList]);
};

// export const refreshIdAtom = atom(0, (get, set) => {
//   set(refreshIdAtom, get(refreshIdAtom) + 1);
// });

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
        await postSwap({ ...swapData, tx });

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
      const key = `${CHAINS[chain].id}-${hash.toLowerCase()}`;
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
      if (!data?.success) {
        setActiveProvider((e) =>
          !e ? e : { ...e, activeLoading: false, activeTx: undefined }
        );
        setActiveSwapTxs((txs) =>
          txs.filter((tx) => tx.toLowerCase() !== data?.hash?.toLowerCase())
        );
        return;
      }

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
