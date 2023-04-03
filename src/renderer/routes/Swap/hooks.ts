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
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Tx } from '@debank/rabby-api/dist/types';
import { atom, useSetAtom } from 'jotai';
import { getRouter, getSpender, postSwap, postSwapParams } from './utils';

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

export const usePostSwap = () => {
  const refreshSwapList = useRefreshSwapTxList();
  const pushTxs = useRef<Record<string, Tx & { hash: string }>>({});

  const setData = useCallback((d: Tx & { hash: string }) => {
    pushTxs.current = {
      ...pushTxs.current,
      [`${d.chainId}-${d.hash.toLowerCase()}`]: d,
    };
  }, []);
  useOnSwapPushTx(setData);

  const postSwapByChainHash = useCallback(
    async (
      chain: CHAINS_ENUM,
      hash: string,
      swapData: Omit<postSwapParams, 'tx'>
    ) => {
      const data = pushTxs.current[`${CHAINS[chain].id}-${hash.toLowerCase()}`];
      if (data) {
        const { hash: _, ...tx } = data;
        await postSwap({ ...swapData, tx });
        refreshSwapList();
      }
    },
    [refreshSwapList]
  );
  return postSwapByChainHash;
};
