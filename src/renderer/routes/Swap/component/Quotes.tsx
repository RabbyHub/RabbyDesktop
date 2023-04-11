import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { CEXQuote, TokenItem } from '@debank/rabby-api/dist/types';
import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { Skeleton, Tooltip } from 'antd';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { formatAmount } from '@/renderer/utils/number';
import clsx from 'clsx';
import { CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { useAsync, useDebounce } from 'react-use';
import ImgLock from '@/../assets/icons/swap/lock.svg';
import IconRcTip from '@/../assets/icons/swap/tip-info.svg?rc';

import { noop } from 'lodash';
import { useSetAtom } from 'jotai';
import { CEX, DEX } from '../constant';
import {
  QuotePreExecResultInfo,
  getAllQuotes,
  getDexQuote,
  getPreExecResult,
  halfBetterRate,
  isSwapWrapToken,
} from '../utils';
import { IconRefresh } from './IconRefresh';
import { WarningOrChecked } from './ReceiveDetail';
import { useVerifySdk } from '../hooks';
import { activeProviderOriginAtom } from '../atom';

const QuotesWrapper = styled.div`
  --green-color: #27c193;
  --red-color: #ff7878;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .title {
      font-size: 18px;
      font-weight: medium;
      color: white;
    }
  }
`;

const ItemWrapper = styled.div`
  position: relative;
  height: 72px;
  font-size: 16px;
  font-weight: medium;
  padding: 0 16px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  outline: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 6px;

  cursor: pointer;

  .cexDisabledTips {
    position: absolute;
    left: 0;
    top: 0;
    transform: translateY(-20px);
    opacity: 0;
    width: 100%;
    height: 0;
    padding-left: 16px;
    background: #000000;
    border-radius: 6px;
    display: flex;
    align-items: center;
    font-size: 12px;
    gap: 8px;
    &.active {
      height: 100%;
      transform: translateY(0);
      opacity: 1;
      transition: opacity 0.35s, transform 0.35s;
    }
  }

  &:hover:not(.disabled) {
    background: rgba(134, 151, 255, 0.1);
    border-color: 2px solid transparent;
    box-shadow: 0px 10px 16px rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }
  &.active {
    background: rgba(134, 151, 255, 0.1);
    outline: 2px solid #8697ff;
    box-shadow: 0px 10px 16px rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }
  &.disabled {
    border-color: transparent;
    box-shadow: none;
    background: rgba(0, 0, 0, 0.08);
    border-radius: 6px;
    cursor: not-allowed;
  }
  &.error {
    & > * {
      opacity: 0.6;
    }
    & > .cexDisabledTips {
      opacity: 0;

      &.active {
        opacity: 1;
      }
    }
  }

  .info {
    width: 144px;
    display: flex;
    align-items: center;
    gap: 6px;
    .logo {
      width: 24px;
      height: 24px;
    }
  }

  .price {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    .toToken {
      color: #fff;
      display: inline-block;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .no-price {
    color: rgba(255, 255, 255, 0.6);
  }

  .percent {
    color: var(--green-color);
    &.red {
      color: var(--red-color);
    }
  }

  .diff {
    margin-left: auto;
  }
`;

export interface QuoteItemProps {
  quote: QuoteResult | null;
  name: string;
  loading?: boolean;
  payToken: TokenItem;
  receiveToken: TokenItem;
  payAmount: string;
  chain: CHAINS_ENUM;
  bestAmount: string;
  isBestQuote: boolean;
  active: boolean;
  userAddress: string;
  slippage: string;
  fee: string;
}

const DexQuoteItem = (
  props: QuoteItemProps & {
    preExecResult: QuotePreExecResultInfo;
  }
) => {
  const {
    quote,
    name: dexId,
    loading,
    bestAmount,
    payToken,
    receiveToken,
    payAmount,
    chain,
    active,
    userAddress,
    isBestQuote,
    slippage,
    fee,
    preExecResult,
  } = props;
  const dexInfo = useMemo(() => DEX[dexId as keyof typeof DEX], [dexId]);

  const { isSdkDataPass } = useVerifySdk({
    chain,
    dexId: dexId as DEX_ENUM,
    slippage,
    data: {
      ...quote,
      fromToken: payToken.id,
      fromTokenAmount: new BigNumber(payAmount)
        .times(10 ** payToken.decimals)
        .toFixed(0, 1),
      toToken: receiveToken?.id,
    } as typeof quote,
    payToken,
    receiveToken,
  });

  const updateActiveQuoteProvider = useSetAtom(activeProviderOriginAtom);

  const {
    value: halfAmountQuotePreExecTxResult,
    error: halfAmountQuoteError,
    loading: halfAmountQuoteLoading,
  } = useAsync(async () => {
    if (active) {
      const halfAmount = new BigNumber(payAmount).div(2).toString(10);
      const halfAmountQuoteInfo = await getDexQuote({
        payToken,
        receiveToken,
        userAddress,
        slippage,
        fee,
        chain,
        dexId: dexId as DEX_ENUM,
        payAmount: halfAmount,
      });
      if (!halfAmountQuoteInfo?.data) {
        throw new Error('half quote failed');
      }
      const result = await getPreExecResult({
        userAddress,
        chain,
        payToken,
        receiveToken,
        payAmount: halfAmount,
        quote: halfAmountQuoteInfo?.data,
        dexId: dexId as DEX_ENUM,
      });
      return result;
    }
    return null;
  }, [
    active,
    chain,
    dexId,
    fee,
    payAmount,
    payToken,
    receiveToken,
    slippage,
    userAddress,
  ]);

  const halfBetterRateString = useMemo(() => {
    if (
      active &&
      !halfAmountQuoteLoading &&
      !halfAmountQuoteError &&
      halfAmountQuotePreExecTxResult &&
      preExecResult
    ) {
      return (
        halfBetterRate(
          preExecResult?.swapPreExecTx,
          halfAmountQuotePreExecTxResult?.swapPreExecTx
        ) || ''
      );
    }
    return '';
  }, [
    active,
    halfAmountQuoteLoading,
    halfAmountQuoteError,
    halfAmountQuotePreExecTxResult,
    preExecResult,
  ]);

  const [middleContent, rightContent, disabled] = useMemo(() => {
    let center: React.ReactNode = <div className="">-</div>;
    let right: React.ReactNode = '';
    let disable = false;

    if (!quote?.toTokenAmount) {
      right = <div className="text-opacity-60">Unable to fetch the price</div>;
      disable = true;
    }

    if (quote?.toTokenAmount) {
      const bestQuoteAmount = new BigNumber(bestAmount);
      const receivedTokeAmountBn = new BigNumber(quote?.toTokenAmount).div(
        10 ** (quote?.toTokenDecimals || receiveToken.decimals)
      );
      const percent = new BigNumber(quote?.toTokenAmount)
        .minus(bestQuoteAmount || 0)
        .div(bestQuoteAmount)
        .times(100);

      const s = formatAmount(receivedTokeAmountBn.toString(10));
      center = (
        <>
          <span className="toToken" title={s}>
            {s}
          </span>{' '}
          {receiveToken.symbol}
        </>
      );

      right = (
        <span className={clsx('percent', percent.lt(0) && 'red')}>
          {isBestQuote
            ? 'Best'
            : `${percent.toFixed(2, BigNumber.ROUND_DOWN)}%`}
        </span>
      );
    }
    if (quote?.toTokenAmount && !preExecResult) {
      center = <div className="">-</div>;
      right = (
        <div className="text-opacity-60">Fail to simulate transaction</div>
      );
      disable = true;
    }

    if (!isSdkDataPass) {
      disable = true;
      center = <div className="">-</div>;
      right = (
        <div className="text-opacity-60">Security verification failed</div>
      );
    }
    return [center, right, disable];
  }, [
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    preExecResult,
    isSdkDataPass,
    bestAmount,
    receiveToken.decimals,
    receiveToken.symbol,
    isBestQuote,
  ]);

  const quoteWarning = useMemo(() => {
    if (!quote?.toTokenAmount || !preExecResult) {
      return '';
    }

    if (isSwapWrapToken(payToken.id, receiveToken.id, chain)) {
      return '';
    }
    const receivedTokeAmountBn = new BigNumber(quote?.toTokenAmount || 0).div(
      10 ** (quote?.toTokenDecimals || receiveToken.decimals)
    );

    const diff = receivedTokeAmountBn
      .minus(
        preExecResult?.swapPreExecTx?.balance_change.receive_token_list[0]
          ?.amount || 0
      )
      .div(receivedTokeAmountBn);

    const diffPercent = diff.times(100);

    return diffPercent.gt(0.01)
      ? `${diffPercent.toPrecision(2)}% (${formatAmount(diff.toString(10))} ${
          receiveToken.symbol
        })`
      : '';
  }, [
    chain,
    payToken.id,
    preExecResult,
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    receiveToken.decimals,
    receiveToken.id,
    receiveToken.symbol,
  ]);

  const CheckIcon = useCallback(() => {
    if (disabled || loading || !quote?.tx || !preExecResult?.swapPreExecTx) {
      return null;
    }
    return <WarningOrChecked quoteWarning={quoteWarning} />;
  }, [
    disabled,
    loading,
    quote?.tx,
    preExecResult?.swapPreExecTx,
    quoteWarning,
  ]);

  const handleClick = useCallback(() => {
    if (active || disabled) return;
    updateActiveQuoteProvider({
      name: dexId,
      quote,
      gasPrice: preExecResult?.gasPrice,
      shouldApproveToken: !!preExecResult?.shouldApproveToken,
      shouldTwoStepApprove: !!preExecResult?.shouldTwoStepApprove,
      error: !preExecResult,
      halfBetterRate: halfBetterRateString,
      quoteWarning,
    });
  }, [
    active,
    disabled,
    updateActiveQuoteProvider,
    dexId,
    quote,
    preExecResult,
    halfBetterRateString,
    quoteWarning,
  ]);

  useDebounce(
    () => {
      if (active) {
        updateActiveQuoteProvider((e) => ({
          ...e,
          name: dexId,
          quote,
          gasPrice: preExecResult?.gasPrice,
          shouldApproveToken: !!preExecResult?.shouldApproveToken,
          shouldTwoStepApprove: !!preExecResult?.shouldTwoStepApprove,
          error: !preExecResult,
          halfBetterRate: halfBetterRateString,
          quoteWarning,
        }));
      }
    },
    300,
    [
      quoteWarning,
      halfBetterRateString,
      active,
      dexId,
      updateActiveQuoteProvider,
      quote,
      preExecResult,
    ]
  );

  return (
    <ItemWrapper
      onClick={handleClick}
      className={clsx(active && 'active', disabled && 'disabled error')}
    >
      <div className="info">
        <img className="logo" src={dexInfo.logo} />
        <span>{dexInfo.name}</span>
        {!!preExecResult?.shouldApproveToken && (
          <Tooltip
            overlayClassName="rectangle max-w-[300px]"
            title="Need to approve token before swap"
          >
            <img src={ImgLock} className="w-14 h-14" />
          </Tooltip>
        )}
      </div>
      <div className="price">
        {middleContent}
        <CheckIcon />
      </div>
      <div className="diff">{rightContent}</div>
    </ItemWrapper>
  );
};

const CexQuoteItem = (props: {
  name: string;
  data: CEXQuote | null;
  bestAmount: string;
  isBestQuote: boolean;
}) => {
  const { name, data, bestAmount, isBestQuote } = props;
  const dexInfo = useMemo(() => CEX[name as keyof typeof CEX], [name]);

  const [middleContent, rightContent] = useMemo(() => {
    let center: React.ReactNode = <div className="">-</div>;
    let right: React.ReactNode = '';
    let disable = false;

    if (!data?.receive_token?.amount) {
      right = (
        <div className="text-opacity-60">This token pair is not supported</div>
      );
      disable = true;
    }

    if (data?.receive_token?.amount) {
      const bestQuoteAmount = new BigNumber(bestAmount);
      const receiveToken = data.receive_token;
      const percent = new BigNumber(receiveToken.amount)
        .times(10 ** receiveToken.decimals)
        .minus(bestQuoteAmount || 0)
        .div(bestQuoteAmount)
        .times(100);
      const s = formatAmount(receiveToken.amount.toString(10));
      center = (
        <>
          <span className="toToken" title={s}>
            {s}
          </span>{' '}
          {receiveToken.symbol}
        </>
      );

      right = (
        <span className={clsx('percent', percent.lt(0) && 'red')}>
          {isBestQuote
            ? 'Best'
            : `${percent.toFixed(2, BigNumber.ROUND_DOWN)}%`}
        </span>
      );
    }

    return [center, right, disable];
  }, [data?.receive_token, bestAmount, isBestQuote]);

  const [disabledTips, setDisabledTips] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const handleClick = useCallback(() => {
    setDisabledTips((e) => {
      if (!e) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setDisabledTips(false);
        }, 3000);
        return true;
      }
      return e;
    });
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ItemWrapper
      className={clsx('disabled', !data?.receive_token?.amount && 'error')}
      onClick={handleClick}
    >
      <div className="info">
        <img className="logo" src={dexInfo.logo} />
        <span>{dexInfo.name}</span>
      </div>
      <div className="price">{middleContent}</div>
      <div className="diff">{rightContent}</div>

      <div className={clsx('cexDisabledTips', disabledTips && 'active')}>
        <IconRcTip className="text-14" />
        <span>
          CEX price is for reference only. Cannot be used for direct trading
          now.
        </span>
      </div>
    </ItemWrapper>
  );
};

const quoteCount = Object.keys(CEX).length + Object.keys(DEX).length;
interface QuotesProps
  extends Omit<
    QuoteItemProps,
    'bestAmount' | 'name' | 'quote' | 'active' | 'isBestQuote'
  > {
  list?: Awaited<ReturnType<typeof getAllQuotes>>;
  activeName?: string;
  refresh?: () => void;
}
export const Quotes = (props: QuotesProps) => {
  const {
    list = [],
    loading = false,
    activeName,
    refresh = noop,
    ...other
  } = props;

  const sortedList = useMemo(
    () =>
      list.sort((a, b) => {
        const getNumber = (quote: typeof a) => {
          if (quote.isDex) {
            if (!quote.preExecResult) {
              return new BigNumber(0);
            }
            return new BigNumber(quote?.data?.toTokenAmount || 0);
          }

          return new BigNumber(quote?.data?.receive_token?.amount || 0).times(
            10 ** other.receiveToken.decimals
          );
        };
        return getNumber(b).minus(getNumber(a)).toNumber();
      }),
    [list, other?.receiveToken?.decimals]
  );
  const loadingCount = useMemo(() => {
    return quoteCount - (sortedList?.length || 0);
  }, [sortedList?.length]);
  return (
    <QuotesWrapper>
      <div className="header">
        <div className="title">The following swap rates are found</div>
        <IconRefresh refresh={refresh} loading={loading} />
      </div>

      <div className="flex flex-col gap-[20px]">
        {sortedList.map((params, idx) => {
          const { name, data, isDex } = params;
          const bestQuote = sortedList?.[0];
          const bestAmount =
            (bestQuote?.isDex
              ? bestQuote?.data?.toTokenAmount
              : new BigNumber(bestQuote.data?.receive_token.amount || '0')
                  .times(10 ** other.receiveToken.decimals)
                  .toString(10)) || '0';
          if (isDex) {
            return (
              <DexQuoteItem
                preExecResult={params.preExecResult}
                quote={data}
                name={name}
                isBestQuote={idx === 0}
                bestAmount={`${bestAmount}`}
                active={activeName === name}
                {...other}
              />
            );
          }
          return (
            <CexQuoteItem
              name={name}
              data={data}
              bestAmount={`${bestAmount}`}
              isBestQuote={idx === 0}
            />
          );
        })}
      </div>
      {loading && (
        <div
          className={clsx(
            'flex flex-col gap-[20px]',
            loadingCount !== quoteCount && 'mt-20'
          )}
        >
          {Array(loadingCount)
            .fill(1)
            .map((_, i) => (
              <Skeleton.Input
                active
                block
                style={{ height: 72, borderRadius: '6px', opacity: '0.5' }}
                key={`${_ + i}`}
              />
            ))}
        </div>
      )}
    </QuotesWrapper>
  );
};
