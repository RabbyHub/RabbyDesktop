import { GasLevel, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';
import { CHAINS_ENUM } from '@/renderer/utils/constant';
import { useDebounce, useLocation } from 'react-use';
import { WrapTokenAddressMap } from '@rabby-wallet/rabby-swap';
import { useSwap } from '@/renderer/hooks/rabbyx/useSwap';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { useSearchParams } from 'react-router-dom';
import { findChain } from '@/renderer/utils/chain';
import { isSameAddress } from '@/renderer/utils/address';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import BigNumber from 'bignumber.js';
import { useRbiSource } from '@/renderer/hooks/useRbiSource';
import { stats } from '@/isomorphic/stats';

import { query2obj } from '@/isomorphic/url';
import { getChainDefaultToken } from '../constant';
import {
  activeProviderOriginAtom,
  QuoteProvider,
  refreshIdAtom,
  useSetQuoteVisible,
} from '../atom';
import {
  getToken,
  TDexQuoteData,
  tokenAmountBn,
  validSlippage,
} from '../utils';
import { useSlippage, useSlippageStore } from './slippage';
import { useGetSwapAllQuotes } from './quote';

type GasLevelType = any;

const useTokenInfo = ({
  userAddress,
  chain,
  defaultToken,
}: {
  userAddress?: string;
  chain?: CHAINS_ENUM;
  defaultToken?: TokenItem;
}) => {
  const refreshId = useAtomValue(refreshIdAtom);
  const [token, setToken] = useState<TokenItem | undefined>(defaultToken);

  const { value, loading, error } = useAsync(async () => {
    if (userAddress && token?.id && chain) {
      const data = await getToken({
        addr: userAddress,
        tokenId: token.id,
        chain,
      });
      return data;
    }
    return undefined;
  }, [refreshId, userAddress, token?.id, chain]);

  useDebounce(
    () => {
      if (value && !error && !loading) {
        setToken(value);
      }
    },
    300,
    [value, error, loading]
  );

  if (error) {
    console.error('token info error', chain, token?.symbol, token?.id, error);
  }
  return [token, setToken] as const;
};

export interface FeeProps {
  fee: '0.25' | '0';
  symbol?: string;
}

export const useTokenPair = (userAddress: string) => {
  const [refreshId, setRefreshId] = useAtom(refreshIdAtom);

  const {
    swap,
    setLastSelectedSwapChain,
    setSelectedFromToken,
    setSelectedToToken,
  } = useSwap();

  const { selectedChain, selectedToToken, selectedFromToken } = swap;

  const [chain, setChain] = useState(selectedChain || CHAINS_ENUM.ETH);

  const handleChain = useCallback(
    (c: CHAINS_ENUM) => {
      setChain(c);
      setLastSelectedSwapChain(c);
    },
    [setLastSelectedSwapChain]
  );

  const [payToken, setPayToken] = useTokenInfo({
    userAddress,
    chain,
    defaultToken: selectedFromToken || getChainDefaultToken(chain),
  });

  const [receiveToken, setReceiveToken] = useTokenInfo({
    userAddress,
    chain,
    defaultToken: selectedToToken,
  });

  const [bestQuoteDex, setBestQuoteDex] = useState<string>('');

  const [inputAmount, setPayAmount] = useState('');
  const debouncePayAmount = useDebounceValue(inputAmount, 300);

  const expiredTimer = useRef<NodeJS.Timeout>();
  const [expired, setExpired] = useState(false);

  const {
    slippageChanged,
    setSlippageChanged,
    slippageState,
    slippage,
    setSlippage,
  } = useSlippage();

  const { autoSlippage } = useSlippageStore();

  const [currentProvider, setOriActiveProvider] = useAtom(
    activeProviderOriginAtom
  );

  const setActiveProvider: React.Dispatch<
    React.SetStateAction<QuoteProvider | undefined>
  > = useCallback(
    (p) => {
      if (expiredTimer.current) {
        clearTimeout(expiredTimer.current);
      }
      setSlippageChanged(false);
      setExpired(false);
      expiredTimer.current = setTimeout(() => {
        setExpired(true);
      }, 1000 * 30);
      setOriActiveProvider(p);
    },
    [setOriActiveProvider, setSlippageChanged]
  );

  const switchChain = useCallback(
    (c: CHAINS_ENUM, opts?: { payTokenId?: string; changeTo?: boolean }) => {
      handleChain(c);
      if (!opts?.changeTo) {
        setPayToken({
          ...getChainDefaultToken(c),
          ...(opts?.payTokenId ? { id: opts?.payTokenId } : {}),
        });
        setReceiveToken(undefined);
      } else {
        setReceiveToken({
          ...getChainDefaultToken(c),
          ...(opts?.payTokenId ? { id: opts?.payTokenId } : {}),
        });
        // setPayToken(undefined);
      }
      setPayAmount('');
      setActiveProvider(undefined);
    },
    [handleChain, setActiveProvider, setPayToken, setReceiveToken]
  );

  const [searchParams] = useSearchParams();

  // const searchPayTokenId = searchParams.get('payTokenId');
  // const searchChain = searchParams.get('chain');

  const location = useLocation();

  // console.log('location', location);

  const searchObj = useMemo(() => {
    return location?.hash ? query2obj(location?.hash) : undefined;
  }, [location?.hash]);

  // useAsyncInitializeChainList({
  //   // NOTICE: now `useTokenPair` is only used for swap page, so we can use `SWAP_SUPPORT_CHAINS` here
  //   supportChains: SWAP_SUPPORT_CHAINS,
  //   onChainInitializedAsync: (firstEnum) => {
  //     // only init chain if it's not cached before
  //     if (!searchObj?.chain && !searchObj.payTokenId && !initialSelectedChain) {
  //       switchChain(firstEnum);
  //     }
  //   },
  // });

  useEffect(() => {
    setSelectedFromToken(payToken);
  }, [payToken, setSelectedFromToken]);

  useEffect(() => {
    setSelectedToToken(receiveToken);
  }, [receiveToken, setSelectedToToken]);

  const [feeRate, setFeeRate] = useState<FeeProps['fee']>('0');

  const exchangeToken = useCallback(() => {
    setPayToken(receiveToken);
    setReceiveToken(payToken);
  }, [setPayToken, receiveToken, setReceiveToken, payToken]);

  const chainObj = useMemo(() => findChain({ enum: chain }), [chain]);

  const payTokenIsNativeToken = useMemo(() => {
    if (payToken) {
      return isSameAddress(payToken.id, chainObj?.nativeTokenAddress || '');
    }
    return false;
  }, [chainObj?.nativeTokenAddress, payToken]);

  const handleAmountChange: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      const v = e.target.value;
      if (!/^\d*(\.\d*)?$/.test(v)) {
        return;
      }
      setPayAmount(v);
    }, []);

  const [gasLevel, setGasLevel] = useState<GasLevelType>('normal');
  const gasPriceRef = useRef<number>();

  const { value: gasList } = useAsync(async () => {
    gasPriceRef.current = undefined;
    setGasLevel('normal');
    const data = await walletOpenapi.gasMarket(chainObj!.serverId);
    return data;
  }, [chainObj]);

  const [reserveGasOpen, setReserveGasOpen] = useState(false);

  const normalGasPrice = useMemo(
    () => gasList?.find((e) => e.level === 'normal')?.price,
    [gasList]
  );

  const nativeTokenDecimals = useMemo(
    () => findChain({ enum: chain })?.nativeTokenDecimals || 1e18,
    [chain]
  );

  const gasLimit = useMemo(
    () => (chain === CHAINS_ENUM.ETH ? 1000000 : 2000000),
    [chain]
  );

  useEffect(() => {
    if (payTokenIsNativeToken && gasList) {
      const checkGasIsEnough = (price: number) => {
        return new BigNumber(payToken?.raw_amount_hex_str || 0, 16).gte(
          new BigNumber(gasLimit).times(price)
        );
      };
      const normalPrice =
        gasList?.find((e) => e.level === 'normal')?.price || 0;
      const slowPrice = gasList?.find((e) => e.level === 'slow')?.price || 0;
      const isNormalEnough = checkGasIsEnough(normalPrice);
      const isSlowEnough = checkGasIsEnough(slowPrice);
      if (isNormalEnough) {
        setGasLevel('normal');
        gasPriceRef.current = normalGasPrice;
      } else if (isSlowEnough) {
        setGasLevel('slow');
        gasPriceRef.current = slowPrice;
      } else {
        setGasLevel('custom');
        gasPriceRef.current = 0;
      }
    }
  }, [
    payTokenIsNativeToken,
    gasList,
    gasLimit,
    payToken?.raw_amount_hex_str,
    normalGasPrice,
  ]);

  const setNativeTokenMax = useCallback(() => {
    if (payToken && gasPriceRef.current !== undefined) {
      const val = tokenAmountBn(payToken).minus(
        new BigNumber(gasLimit)
          .times(gasPriceRef.current)
          .div(10 ** nativeTokenDecimals)
      );
      setPayAmount(val.lt(0) ? '0' : val.toString(10));
    }
  }, [gasLimit, nativeTokenDecimals, payToken]);

  const closeReserveGasOpen = useCallback(() => {
    setReserveGasOpen(false);
    // if (payToken && gasPriceRef.current !== undefined) {
    //   const val = tokenAmountBn(payToken).minus(
    //     new BigNumber(gasLimit)
    //       .times(gasPriceRef.current)
    //       .div(10 ** nativeTokenDecimals)
    //   );
    //   setPayAmount(val.lt(0) ? '0' : val.toString(10));
    // }
  }, []);

  const changeGasPrice = useCallback(
    (gasLevelVALUE: GasLevel) => {
      gasPriceRef.current =
        gasLevelVALUE.level === 'custom' ? 0 : gasLevelVALUE.price;
      setGasLevel(gasLevelVALUE.level as GasLevelType);
      setNativeTokenMax();
      closeReserveGasOpen();
    },
    [closeReserveGasOpen, setNativeTokenMax]
  );

  const handleBalance = useCallback(() => {
    if (payTokenIsNativeToken) {
      setReserveGasOpen(true);
      return;
    }
    if (!payTokenIsNativeToken && payToken) {
      setPayAmount(tokenAmountBn(payToken).toString(10));
    }
  }, [payToken, payTokenIsNativeToken]);

  const isStableCoin = useMemo(() => {
    if (payToken?.price && receiveToken?.price) {
      return new BigNumber(payToken?.price)
        .minus(receiveToken?.price)
        .div(payToken?.price)
        .abs()
        .lte(0.01);
    }
    return false;
  }, [payToken, receiveToken]);

  const [isWrapToken, wrapTokenSymbol] = useMemo(() => {
    if (payToken?.id && receiveToken?.id) {
      const wrapTokens = [
        WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap],
        chainObj?.nativeTokenAddress,
      ];
      const res =
        !!wrapTokens.find((token) => isSameAddress(payToken?.id, token)) &&
        !!wrapTokens.find((token) => isSameAddress(receiveToken?.id, token));
      return [
        res,
        isSameAddress(
          payToken?.id,
          WrapTokenAddressMap[chain as keyof typeof WrapTokenAddressMap]
        )
          ? payToken.symbol
          : receiveToken.symbol,
      ];
    }
    return [false, ''];
  }, [
    payToken?.id,
    payToken?.symbol,
    receiveToken?.id,
    receiveToken?.symbol,
    chain,
    chainObj?.nativeTokenAddress,
  ]);

  const inSufficient = useMemo(
    () =>
      payToken
        ? tokenAmountBn(payToken).lt(debouncePayAmount)
        : new BigNumber(0).lt(debouncePayAmount),
    [payToken, debouncePayAmount]
  );

  useEffect(() => {
    if (isWrapToken) {
      setFeeRate('0');
    }
    if (autoSlippage) {
      setSlippage(isStableCoin ? '0.1' : '0.5');
    }
  }, [autoSlippage, isWrapToken, isStableCoin, setSlippage]);

  const [quoteList, setQuotesList] = useState<TDexQuoteData[]>([]);

  useEffect(() => {
    setQuotesList([]);
    setActiveProvider(undefined);
  }, [
    payToken?.id,
    receiveToken?.id,
    chain,
    debouncePayAmount,
    inSufficient,
    setActiveProvider,
  ]);

  const fetchIdRef = useRef(0);

  const setQuote = useCallback(
    (id: number) => (quote: TDexQuoteData) => {
      if (id === fetchIdRef.current) {
        setQuotesList((e) => {
          const index = e.findIndex((q) => q.name === quote.name);

          const v: TDexQuoteData = { ...quote, loading: false };
          if (index === -1) {
            return [...e, v];
          }
          e[index] = v;
          return [...e];
        });
      }
    },
    []
  );

  const getAllQuotes = useGetSwapAllQuotes();
  const { loading: quoteLoading, error: quotesError } = useAsync(async () => {
    fetchIdRef.current += 1;
    const currentFetchId = fetchIdRef.current;
    if (
      userAddress &&
      payToken?.id &&
      receiveToken?.id &&
      receiveToken &&
      chain &&
      Number(debouncePayAmount) > 0 &&
      feeRate &&
      !inSufficient
    ) {
      setQuotesList((e) =>
        e.map((q) => ({ ...q, loading: true, isBest: false }))
      );
      setActiveProvider(undefined);
      return getAllQuotes({
        userAddress,
        payToken,
        receiveToken,
        slippage: slippage || '0.1',
        chain,
        payAmount: debouncePayAmount,
        fee: feeRate,
        setQuote: setQuote(currentFetchId),
      }).finally(() => {});
    }
  }, [
    setActiveProvider,
    inSufficient,
    setQuotesList,
    setQuote,
    refreshId,
    userAddress,
    payToken?.id,
    receiveToken?.id,
    chain,
    debouncePayAmount,
    feeRate,
  ]);

  useEffect(() => {
    if (
      !quoteLoading &&
      receiveToken &&
      quoteList.every((q, idx) => !q.loading)
    ) {
      const sortIncludeGasFee = true;
      const sortedList = [
        ...(quoteList?.sort((a, b) => {
          const getNumber = (quote: typeof a) => {
            const price = receiveToken.price ? receiveToken.price : 1;
            if (inSufficient) {
              return new BigNumber(quote.data?.toTokenAmount || 0)
                .div(
                  10 ** (quote.data?.toTokenDecimals || receiveToken.decimals)
                )
                .times(price);
            }
            if (!quote.preExecResult || !quote.preExecResult.isSdkPass) {
              return new BigNumber(Number.MIN_SAFE_INTEGER);
            }
            const balanceChangeReceiveTokenAmount =
              quote?.preExecResult.swapPreExecTx.balance_change.receive_token_list.find(
                (token) => isSameAddress(token.id, receiveToken.id)
              )?.amount || 0;

            if (sortIncludeGasFee) {
              return new BigNumber(balanceChangeReceiveTokenAmount)
                .times(price)
                .minus(quote?.preExecResult?.gasUsdValue || 0);
            }

            return new BigNumber(balanceChangeReceiveTokenAmount).times(price);
          };
          return getNumber(b).minus(getNumber(a)).toNumber();
        }) || []),
      ];

      if (sortedList?.[0]) {
        const bestQuote = sortedList[0];
        const { preExecResult } = bestQuote;

        setBestQuoteDex(bestQuote.name);

        setActiveProvider((preItem) =>
          !bestQuote.preExecResult || !bestQuote.preExecResult.isSdkPass
            ? undefined
            : preItem?.manualClick
            ? preItem
            : {
                name: bestQuote.name,
                quote: bestQuote.data,
                preExecResult: bestQuote.preExecResult,
                gasPrice: preExecResult?.gasPrice,
                shouldApproveToken: !!preExecResult?.shouldApproveToken,
                shouldTwoStepApprove: !!preExecResult?.shouldTwoStepApprove,
                error: !preExecResult,
                halfBetterRate: '',
                quoteWarning: undefined,
                actualReceiveAmount:
                  preExecResult?.swapPreExecTx.balance_change.receive_token_list.find(
                    (token) => isSameAddress(token.id, receiveToken.id)
                  )?.amount || '',
                gasUsd: preExecResult?.gasUsd,
              }
        );
      }
    }
  }, [quoteList, quoteLoading, receiveToken, inSufficient, setActiveProvider]);

  if (quotesError) {
    console.error('quotesError', quotesError);
  }

  const {
    value: slippageValidInfo,
    error: slippageValidError,
    loading: slippageValidLoading,
  } = useAsync(async () => {
    if (chain && Number(slippage) && payToken?.id && receiveToken?.id) {
      return validSlippage({
        chain,
        slippage,
        payTokenId: payToken?.id,
        receiveTokenId: receiveToken?.id,
      });
    }
  }, [slippage, chain, payToken?.id, receiveToken?.id, refreshId]);
  const openQuote = useSetQuoteVisible();

  const openQuotesList = useCallback(() => {
    setQuotesList([]);
    setRefreshId();
    openQuote(true);
  }, [openQuote, setRefreshId]);

  useEffect(() => {
    if (expiredTimer.current) {
      clearTimeout(expiredTimer.current);
    }
    setExpired(false);
    setActiveProvider(undefined);
    setSlippageChanged(false);
  }, [
    payToken?.id,
    receiveToken?.id,
    chain,
    debouncePayAmount,
    inSufficient,
    setActiveProvider,
    setSlippageChanged,
  ]);

  useEffect(() => {
    if (searchObj?.chain && searchObj?.payTokenId) {
      const target = findChain({
        serverId: searchObj.chain,
      });
      if (target) {
        setChain(target?.enum);
        setPayToken({
          ...getChainDefaultToken(target?.enum),
          id: searchObj.payTokenId,
        });
        setReceiveToken(undefined);
      }
    }
  }, [searchObj?.chain, searchObj?.payTokenId, setPayToken, setReceiveToken]);

  const rbiSource = useRbiSource();

  useEffect(() => {
    if (rbiSource) {
      stats.report('enterSwapDescPage', {
        refer: rbiSource,
      });
    }
  }, [rbiSource]);

  return {
    bestQuoteDex,
    gasLevel,
    reserveGasOpen,
    closeReserveGasOpen,
    changeGasPrice,
    gasLimit,
    gasList,

    chain,
    switchChain,
    setPayAmount,

    payToken,
    setPayToken,
    receiveToken,
    setReceiveToken,
    exchangeToken,
    payTokenIsNativeToken,

    handleAmountChange,
    handleBalance,
    inputAmount,
    debouncePayAmount,

    isWrapToken,
    wrapTokenSymbol,
    inSufficient,
    slippageChanged,
    setSlippageChanged,
    slippageState,
    slippage,
    setSlippage,
    feeRate,

    openQuotesList,
    quoteLoading,
    quoteList,
    currentProvider,
    setActiveProvider,

    slippageValidInfo,
    slippageValidLoading,

    expired,
  };
};
