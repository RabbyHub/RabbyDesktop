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
import { useMemo } from 'react';
import { getRouter, getSpender } from './utils';

// REMOVE: after fixed rabby-swap
const quoteNativeTokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const getRabbyTokenAddress = (addr: string, chain: CHAINS_ENUM) =>
  isSameAddress(addr, quoteNativeTokenAddress)
    ? CHAINS[chain].nativeTokenAddress
    : addr;

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
  // REMOVE: after fixed rabby-swap
  chain: CHAINS_ENUM,
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
        isSameAddress(
          callDataResult.fromToken,
          // REMOVE: after fixed rabby-swap
          getRabbyTokenAddress(data.fromToken, chain)
        ) &&
        callDataResult.fromTokenAmount === data.fromTokenAmount &&
        // REMOVE: after fixed rabby-swap
        isSameAddress(
          callDataResult.toToken,
          getRabbyTokenAddress(data.toToken, chain)
        ) &&
        new BigNumber(callDataResult.minReceiveToTokenAmount)
          .minus(estimateMinReceive)
          .div(estimateMinReceive)
          .abs()
          .lte(0.05)
      );
    }
    return true;
  }, [callDataResult, data, slippage, chain]);

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
    data?.tx.to,
    data?.spender,
    payToken?.id,
    receiveToken?.id
  );

  const callDataPass = useVerifyCalldata(
    // REMOVE: after fixed rabby-swap
    chain,
    data,
    actualDexId,
    new BigNumber(slippage).div(100).toFixed(),
    data?.tx ? { ...data?.tx, chainId: CHAINS[chain].id } : undefined
  );

  return {
    isSdkDataPass: routerPass && spenderPass && callDataPass,
  };
};
