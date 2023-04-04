import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { isSameAddress } from '@/renderer/utils/address';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import {
  CEXQuote,
  ExplainTxResponse,
  TokenItem,
  Tx,
} from '@debank/rabby-api/dist/types';
import {
  DEX_ENUM,
  DEX_ROUTER_WHITELIST,
  DEX_SPENDER_WHITELIST,
  getQuote,
  WrapTokenAddressMap,
} from '@rabby-wallet/rabby-swap';
import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import BigNumber from 'bignumber.js';
import { SWAP_FEE_ADDRESS, DEX, ETH_USDT_CONTRACT, CEX } from './constant';

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

interface getDexQuoteParams {
  payToken: TokenItem;
  receiveToken: TokenItem;
  userAddress: string;
  slippage: string;
  fee: string;
  payAmount: string;
  chain: CHAINS_ENUM;
  dexId: DEX_ENUM;
}

export const getDexQuote = async ({
  payToken,
  receiveToken,
  userAddress,
  slippage,
  fee: feeAfterDiscount,
  payAmount,
  chain,
  dexId,
}: getDexQuoteParams): Promise<{
  data: null | QuoteResult;
  name: string;
  isDex: true;
}> => {
  try {
    const data = await getQuote(
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
        feeRate: Number(feeAfterDiscount) || 0,
        chain,
      }
    );

    return { data, name: dexId, isDex: true };
  } catch (error) {
    console.error('getQuote error ', error);
    return { data: null, name: dexId, isDex: true };
  }
  // return undefined;
};

export const getAllDexQuotes = async (
  params: Omit<getDexQuoteParams, 'dexId'>
) => {
  // const { payToken, receiveToken, chain } = params;
  // if (isSwapWrapToken(payToken.id, receiveToken.id, chain)) {
  //   const data = await getDexQuote({ ...params, dexId: DEX_ENUM.WRAPTOKEN });
  //   return Promise.allSettled(Object.keys(DEX).map(() => data));
  // }
  return Promise.all(
    (Object.keys(DEX) as DEX_ENUM[]).map((dexId) =>
      getDexQuote({ ...params, dexId })
    )
  );
};

interface getAllCexQuotesParams {
  payToken: TokenItem;
  payAmount: string;
  receiveTokenId: string;
  chain: CHAINS_ENUM;
}

type TCexQuoteData = { data: null | CEXQuote; name: string; isDex: false };
const getCexQuote = async (
  params: getAllCexQuotesParams & { cexId: string }
): Promise<TCexQuoteData> => {
  const {
    payToken,
    payAmount,
    receiveTokenId: receive_token_id,
    chain,
    cexId: cex_id,
  } = params;

  const p = {
    cex_id,
    pay_token_amount: payAmount,
    chain_id: CHAINS[chain].serverId,
    pay_token_id: payToken.id,
    receive_token_id,
  };

  try {
    const data = await walletOpenapi.getCEXSwapQuote(p);
    return {
      data,
      name: cex_id,
      isDex: false,
    };
  } catch (error) {
    return {
      data: null,
      name: cex_id,
      isDex: false,
    };
  }
};

export const getAllQuotes = async (
  params: Omit<getDexQuoteParams, 'dexId'>
) => {
  return Promise.all([
    ...(Object.keys(DEX) as DEX_ENUM[]).map((dexId) =>
      getDexQuote({ ...params, dexId })
    ),
    ...Object.keys(CEX).map((cexId) =>
      getCexQuote({
        cexId,
        payToken: params.payToken,
        payAmount: params.payAmount,
        receiveTokenId: params.receiveToken.id,
        chain: params.chain,
      })
    ),
  ]);
};

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
    chain_id: CHAINS[chain].serverId,
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
    dex_id: dexId,
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
    CHAINS[chain].serverId,
    tokenId // CHAINS[chain].nativeTokenAddress
  );
};

export const getRouter = (dexId: DEX_ENUM, chain: CHAINS_ENUM) => {
  const list = DEX_ROUTER_WHITELIST[dexId as keyof typeof DEX_ROUTER_WHITELIST];
  return list[chain as keyof typeof list];
};

export const getSpender = (dexId: DEX_ENUM, chain: CHAINS_ENUM) => {
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
    payToken?.id === CHAINS[chain].nativeTokenAddress ||
    isSwapWrapToken(payToken.id, receiveToken.id, chain)
  ) {
    return [true, false];
  }

  const allowance = await walletController.getERC20Allowance(
    CHAINS[chain].serverId,
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
    chainId: CHAINS[chain].id,
  });

  const gasMarket = await walletOpenapi.gasMarket(CHAINS[chain].serverId);
  const gasPrice = gasMarket?.[1]?.price;

  let nextNonce = nonce;
  const pendingTx: Tx[] = [];

  const approveToken = async (amount: string) => {
    const tokenApproveParams = await walletController.generateApproveTokenTx({
      from: userAddress,
      to: payToken.id,
      chainId: CHAINS[chain].id,
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
      chainId: CHAINS[chain].id,
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

  return {
    shouldApproveToken: !tokenApproved,
    shouldTwoStepApprove,
    swapPreExecTx,
    gasPrice,
  };
};

export const halfBetterRate = (
  full: ExplainTxResponse,
  half: ExplainTxResponse
) => {
  if (
    full.balance_change.success &&
    full.balance_change.usd_value_change &&
    half.balance_change.success &&
    half.balance_change.usd_value_change
  ) {
    const diff = new BigNumber(half.balance_change.usd_value_change)
      .minus(full.balance_change.usd_value_change)
      .div(full.balance_change.usd_value_change);
    return diff.gt(0)
      ? new BigNumber(diff.toPrecision(1)).times(100).toString(10)
      : null;
  }
  return null;
};
