import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { findChain } from '@/renderer/utils/chain';
import { formatUsdValue } from '@/renderer/utils/number';
import { CHAINS_ENUM } from '@debank/common';
import { OpenApiService } from '@rabby-wallet/rabby-api';
import {
  ExplainTxResponse,
  TokenItem,
  Tx,
} from '@rabby-wallet/rabby-api/dist/types';
import {
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  WrapTokenAddressMap,
  getQuote,
} from '@rabby-wallet/rabby-swap';
import {
  decodeCalldata,
  DecodeCalldataResult,
  QuoteResult,
} from '@rabby-wallet/rabby-swap/dist/quote';
import BigNumber from 'bignumber.js';
import pRetry from 'p-retry';
import { useSwapSupportedDexList } from '@/renderer/hooks/rabbyx/useSwap';
import { useCallback } from 'react';
import { DEX, ETH_USDT_CONTRACT, SWAP_FEE_ADDRESS } from './constant';

export const tokenAmountBn = (token: TokenItem) =>
  new BigNumber(token?.raw_amount_hex_str || 0, 16).div(
    10 ** (token?.decimals || 1)
  );

export function isSwapWrapToken(
  payTokenId: string,
  receiveId: string,
  chain: CHAINS_ENUM
) {
  const wrapTokens = [
    WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap],
    findChain({ enum: chain })?.nativeTokenAddress || '',
  ];
  return (
    !!wrapTokens.find((token) => isSameAddress(payTokenId, token)) &&
    !!wrapTokens.find((token) => isSameAddress(receiveId, token))
  );
}

export interface validSlippageParams {
  chain: CHAINS_ENUM;
  slippage: string;
  payTokenId: string;
  receiveTokenId: string;
}
export const validSlippage = async ({
  chain,
  slippage,
  payTokenId,
  receiveTokenId,
}: validSlippageParams) => {
  const p = {
    slippage: new BigNumber(slippage).div(100).toString(),
    chain_id: findChain({ enum: chain })?.serverId || '',
    from_token_id: payTokenId,
    to_token_id: receiveTokenId,
  };

  return walletOpenapi.checkSlippage(p);
};

export const getSwapList = async (addr: string, start = 0, limit = 5) => {
  const data = await walletOpenapi.getSwapTradeList({
    user_addr: addr,
    start: `${start}`,
    limit: `${limit}`,
  });
  return {
    list: data?.history_list,
    last: data,
    totalCount: data?.total_cnt,
  };
};

export interface postSwapParams {
  payToken: TokenItem;
  receiveToken: TokenItem;
  payAmount: string;
  // receiveRawAmount: string;
  slippage: string;
  dexId: string;
  txId: string;
  quote: QuoteResult;
  tx: Tx;
}
export const postSwap = async ({
  payToken,
  receiveToken,
  payAmount,
  // receiveRawAmount,
  slippage,
  dexId,
  txId,
  quote,
  tx,
}: postSwapParams) =>
  walletOpenapi.postSwap({
    quote: {
      pay_token_id: payToken.id,
      pay_token_amount: Number(payAmount),
      receive_token_id: receiveToken.id,
      receive_token_amount: new BigNumber(quote.toTokenAmount)
        .div(10 ** (quote.toTokenDecimals || receiveToken.decimals))
        .toNumber(),
      slippage: new BigNumber(slippage).div(100).toNumber(),
    },
    // 0xAPI => 0x
    dex_id: dexId.replace('API', ''),
    tx_id: txId,
    tx,
  });

interface getTokenParams {
  addr: string;
  chain: CHAINS_ENUM;
  tokenId: string;
}
export const getToken = async ({ addr, chain, tokenId }: getTokenParams) => {
  return walletOpenapi.getToken(
    addr,
    findChain({ enum: chain })!.serverId,
    tokenId
  );
};

export const getRouter = (dexId: DEX_ENUM, chain: CHAINS_ENUM) => {
  const list = DEX_ROUTER_WHITELIST[dexId as keyof typeof DEX_ROUTER_WHITELIST];
  return list[chain as keyof typeof list];
};

export const getSpender = (dexId: DEX_ENUM, chain: CHAINS_ENUM) => {
  if (dexId === DEX_ENUM.WRAPTOKEN) {
    return '';
  }
  const list =
    DEX_SPENDER_WHITELIST[dexId as keyof typeof DEX_SPENDER_WHITELIST];
  return list[chain as keyof typeof list];
};

const getTokenApproveStatus = async ({
  payToken,
  receiveToken,
  payAmount,
  chain,
  dexId,
}: Pick<
  getDexQuoteParams,
  'payToken' | 'receiveToken' | 'payAmount' | 'chain' | 'dexId'
>) => {
  if (
    payToken?.id === findChain({ enum: chain })?.nativeTokenAddress ||
    isSwapWrapToken(payToken.id, receiveToken.id, chain)
  ) {
    return [true, false];
  }

  const allowance = await walletController.getERC20Allowance(
    findChain({ enum: chain })!.serverId,
    payToken.id,
    getSpender(dexId, chain)
  );

  const tokenApproved = new BigNumber(allowance).gte(
    new BigNumber(payAmount).times(10 ** payToken.decimals)
  );

  if (
    chain === CHAINS_ENUM.ETH &&
    isSameAddress(payToken.id, ETH_USDT_CONTRACT) &&
    Number(allowance) !== 0 &&
    !tokenApproved
  ) {
    return [tokenApproved, true];
  }
  return [tokenApproved, false];
};
const INTERNAL_REQUEST_ORIGIN = window.location.origin;

interface getPreExecResultParams
  extends Omit<getDexQuoteParams, 'fee' | 'slippage'> {
  quote: QuoteResult;
}

export const getPreExecResult = async ({
  userAddress,
  chain,
  payToken,
  receiveToken,
  payAmount,
  dexId,
  quote,
}: getPreExecResultParams) => {
  const nonce = await walletController.getRecommendNonce({
    from: userAddress,
    chainId: findChain({ enum: chain })!.id,
  });

  const gasMarket = await walletOpenapi.gasMarket(
    findChain({ enum: chain })!.serverId
  );
  const gasPrice = gasMarket?.[1]?.price;

  let nextNonce = nonce;
  const pendingTx: Tx[] = [];
  let gasUsed = 0;

  const approveToken = async (amount: string) => {
    const tokenApproveParams = await walletController.generateApproveTokenTx({
      from: userAddress,
      to: payToken.id,
      chainId: findChain({ enum: chain })!.id,
      spender: getSpender(dexId, chain),
      amount,
    });
    const tokenApproveTx = {
      ...tokenApproveParams,
      nonce: nextNonce,
      value: '0x',
      gasPrice: `0x${new BigNumber(gasPrice).toString(16)}`,
      gas: '0x0',
    };

    const tokenApprovePreExecTx = await walletOpenapi.preExecTx({
      tx: tokenApproveTx,
      origin: INTERNAL_REQUEST_ORIGIN,
      address: userAddress,
      updateNonce: true,
      pending_tx_list: pendingTx,
    });

    if (!tokenApprovePreExecTx?.pre_exec?.success) {
      throw new Error('pre_exec_tx error');
    }
    gasUsed += tokenApprovePreExecTx.gas.gas_used;

    pendingTx.push({
      ...tokenApproveTx,
      gas: `0x${new BigNumber(tokenApprovePreExecTx.gas.gas_used)
        .times(4)
        .toString(16)}`,
    });
    nextNonce = `0x${new BigNumber(nextNonce).plus(1).toString(16)}`;
  };

  const [tokenApproved, shouldTwoStepApprove] = await getTokenApproveStatus({
    payToken,
    receiveToken,
    payAmount,
    chain,
    dexId,
  });

  if (shouldTwoStepApprove) {
    await approveToken('0');
  }

  if (!tokenApproved) {
    await approveToken(
      new BigNumber(payAmount).times(10 ** payToken.decimals).toFixed(0, 1)
    );
  }

  const swapPreExecTx = await walletOpenapi.preExecTx({
    tx: {
      ...quote.tx,
      nonce: nextNonce,
      chainId: findChain({ enum: chain })!.id,
      value: `0x${new BigNumber(quote.tx.value).toString(16)}`,
      gasPrice: `0x${new BigNumber(gasPrice).toString(16)}`,
      gas: '0x0',
    } as Tx,
    origin: INTERNAL_REQUEST_ORIGIN,
    address: userAddress,
    updateNonce: true,
    pending_tx_list: pendingTx,
  });

  if (!swapPreExecTx?.pre_exec?.success) {
    throw new Error('pre_exec_tx error');
  }

  gasUsed += swapPreExecTx.gas.gas_used;

  const gasUsdValue = new BigNumber(gasUsed)
    .times(gasPrice)
    .div(10 ** swapPreExecTx.native_token.decimals)
    .times(swapPreExecTx.native_token.price)
    .toString(10);

  return {
    shouldApproveToken: !tokenApproved,
    shouldTwoStepApprove,
    swapPreExecTx,
    gasPrice,
    gasUsdValue,
    gasUsd: formatUsdValue(gasUsdValue),
    isSdkPass: false,
  };
};

export const halfBetterRate = (
  full: ExplainTxResponse,
  half: ExplainTxResponse
) => {
  if (
    full.balance_change.success &&
    half.balance_change.success &&
    half.balance_change.receive_token_list[0]?.amount &&
    full.balance_change.receive_token_list[0]?.amount
  ) {
    const halfReceive = new BigNumber(
      half.balance_change.receive_token_list[0].amount
    );

    const fullREceive = new BigNumber(
      full.balance_change.receive_token_list[0]?.amount
    );
    const diff = new BigNumber(halfReceive).times(2).minus(fullREceive);

    return diff.gt(0)
      ? new BigNumber(diff.div(fullREceive).toPrecision(1))
          .times(100)
          .toString(10)
      : null;
  }
  return null;
};

export type QuotePreExecResultInfo =
  | (Awaited<ReturnType<typeof getPreExecResult>> & { isSdkPass?: boolean })
  | null;

export interface getDexQuoteParams {
  payToken: TokenItem;
  receiveToken: TokenItem;
  userAddress: string;
  slippage: string;
  fee: string;
  payAmount: string;
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
}

export type TDexQuoteData = {
  data: null | QuoteResult;
  name: string;
  isDex: true;
  preExecResult: QuotePreExecResultInfo;
  loading?: boolean;
};
export const getDexQuote = async ({
  payToken,
  receiveToken,
  userAddress,
  slippage,
  fee: feeAfterDiscount,
  payAmount,
  chain,
  dexId,
  setQuote,
}: getDexQuoteParams & {
  setQuote?: (quote: TDexQuoteData) => void;
}): Promise<TDexQuoteData> => {
  try {
    let gasPrice: number;
    const isOpenOcean = dexId === DEX_ENUM.OPENOCEAN;

    if (isOpenOcean) {
      const gasMarket = await walletOpenapi.gasMarket(
        findChain({ enum: chain })!.serverId
      );
      gasPrice = gasMarket?.[1]?.price;
    }
    const data = await pRetry(
      () =>
        getQuote(
          isSwapWrapToken(payToken.id, receiveToken.id, chain)
            ? DEX_ENUM.WRAPTOKEN
            : dexId,
          {
            fromToken: payToken.id,
            toToken: receiveToken.id,
            feeAddress: SWAP_FEE_ADDRESS,
            fromTokenDecimals: payToken.decimals,
            amount: new BigNumber(payAmount)
              .times(10 ** payToken.decimals)
              .toFixed(0, 1),
            userAddress,
            slippage: Number(slippage),
            feeRate:
              feeAfterDiscount === '0' && isOpenOcean
                ? undefined
                : Number(feeAfterDiscount) || 0,
            chain,
            gasPrice,
            fee: true,
          },
          walletOpenapi as unknown as OpenApiService
        ),
      {
        retries: 1,
      }
    );
    let preExecResult = null;
    if (data) {
      try {
        preExecResult = await pRetry(
          () =>
            getPreExecResult({
              userAddress,
              chain,
              payToken,
              receiveToken,
              payAmount,
              quote: data,
              dexId: dexId as DEX_ENUM,
            }),
          {
            retries: 1,
          }
        );

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const { isSdkDataPass } = verifySdk({
          chain,
          dexId,
          slippage,
          data: {
            ...data,
            fromToken: payToken.id,
            fromTokenAmount: new BigNumber(payAmount)
              .times(10 ** payToken.decimals)
              .toFixed(0, 1),
            toToken: receiveToken?.id,
          },
          payToken,
          receiveToken,
        });

        preExecResult.isSdkPass = isSdkDataPass;
      } catch (error) {
        const quote: TDexQuoteData = {
          data,
          name: dexId,
          isDex: true,
          preExecResult: null,
        };
        setQuote?.(quote);
        return quote;
      }
    }
    const quote: TDexQuoteData = {
      data,
      name: dexId,
      isDex: true,
      preExecResult,
    };
    setQuote?.(quote);
    return quote;
  } catch (error) {
    console.error('getQuote error ', error);

    const quote: TDexQuoteData = {
      data: null,
      name: dexId,
      isDex: true,
      preExecResult: null,
    };
    setQuote?.(quote);
    return quote;
  }
};

export const getAllDexQuotes = async (
  params: Omit<getDexQuoteParams, 'dexId'> & {
    setQuote: (quote: TDexQuoteData) => void;
  }
) => {
  return Promise.all(
    (Object.keys(DEX) as DEX_ENUM[]).map((dexId) =>
      getDexQuote({ ...params, dexId })
    )
  );
};

export const verifyRouterAndSpender = (
  chain: CHAINS_ENUM,
  dexId: DEX_ENUM,
  router?: string,
  spender?: string,
  payTokenId?: string,
  receiveTokenId?: string
) => {
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
    findChain({
      enum: chain,
    })?.nativeTokenAddress || ''
  );
  const isWrapTokens = isSwapWrapToken(payTokenId, receiveTokenId, chain);

  return [
    isSameAddress(routerWhitelist, router),
    isNativeToken || isWrapTokens
      ? true
      : isSameAddress(spenderWhitelist, spender),
  ];
};

type ValidateTokenParam = {
  id: string;
  symbol: string;
  decimals: number;
};

const isNativeToken = (chain: CHAINS_ENUM, tokenId: string) =>
  isSameAddress(
    tokenId,
    findChain({
      enum: chain,
    })?.nativeTokenAddress || ''
  );

export const verifyCalldata = <T extends Parameters<typeof decodeCalldata>[1]>(
  data: QuoteResult | null,
  dexId: DEX_ENUM | null,
  slippage: string | number,
  tx?: T
) => {
  let callDataResult: DecodeCalldataResult | null = null;
  if (dexId && dexId !== DEX_ENUM.WRAPTOKEN && tx) {
    try {
      callDataResult = decodeCalldata(dexId, tx) as DecodeCalldataResult;
    } catch (error) {
      callDataResult = null;
    }
  }

  let result = true;
  if (slippage && callDataResult && data && tx) {
    const estimateMinReceive = new BigNumber(data.toTokenAmount).times(
      new BigNumber(1).minus(slippage)
    );
    const chain = findChain({
      id: tx.chainId,
    });

    if (!chain) {
      result = true;
    } else {
      result =
        ((dexId === DEX_ENUM.UNISWAP &&
          isNativeToken(chain.enum, data.fromToken)) ||
          isSameAddress(callDataResult.fromToken, data.fromToken)) &&
        callDataResult.fromTokenAmount === data.fromTokenAmount &&
        isSameAddress(callDataResult.toToken, data.toToken) &&
        new BigNumber(callDataResult.minReceiveToTokenAmount)
          .minus(estimateMinReceive)
          .div(estimateMinReceive)
          .abs()
          .lte(0.05);
    }
  }
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

export const verifySdk = <T extends ValidateTokenParam>(
  p: VerifySdkParams<T>
) => {
  const { chain, dexId, slippage, data, payToken, receiveToken } = p;

  const isWrapTokens = isSwapWrapToken(payToken.id, receiveToken.id, chain);
  const actualDexId = isWrapTokens ? DEX_ENUM.WRAPTOKEN : dexId;

  const [routerPass, spenderPass] = verifyRouterAndSpender(
    chain,
    actualDexId,
    data?.tx?.to,
    data?.spender,
    payToken?.id,
    receiveToken?.id
  );

  const callDataPass = verifyCalldata(
    data,
    actualDexId,
    new BigNumber(slippage).div(100).toFixed(),
    data?.tx
      ? { ...data?.tx, chainId: findChain({ enum: chain })!.id }
      : undefined
  );

  return {
    isSdkDataPass: routerPass && spenderPass && callDataPass,
  };
};
