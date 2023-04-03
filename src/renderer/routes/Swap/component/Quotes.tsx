import { useMemo, useCallback } from 'react';
import { CEXQuote, TokenItem } from '@debank/rabby-api/dist/types';
import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { Skeleton, Tooltip, message } from 'antd';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { formatAmount } from '@/renderer/utils/number';
import clsx from 'clsx';
import { CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { useAsync, useDebounce } from 'react-use';
import ImgLock from '@/../assets/icons/swap/lock.svg';

import { noop } from 'lodash';
import { CEX, DEX } from '../constant';
import {
  getAllQuotes,
  getDexQuote,
  getPreExecResult,
  halfBetterRate,
  isSwapWrapToken,
} from '../utils';
import { IconRefresh } from './IconRefresh';
import { WarningOrChecked } from './ReceiveDetail';
import { useVerifySdk } from '../hooks';
// import { CEXQuote } from '../type';

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
  height: 72px;
  font-size: 16px;
  font-weight: medium;
  padding: 0 16px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 6px;

  cursor: pointer;

  &:hover:not(.disabled),
  &.active {
    background: rgba(134, 151, 255, 0.1);
    border: 1px solid #8697ff;
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

export type QuoteProvider = {
  name: string;
  error?: boolean;
  quote: QuoteResult | null;
  shouldApproveToken: boolean;
  shouldTwoStepApprove: boolean;
  halfBetterRate?: string;
  quoteWarning?: string;
  gasPrice?: number;
};

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
  onClick: (provider: QuoteProvider) => void;
}

const DexQuoteItem = (props: QuoteItemProps) => {
  // const { name, logo, error, symbol, amount, diff, disabled } = props;
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
    onClick,
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

  const {
    value: preExecTx,
    error: preExecTxError,
    loading: preExecTxLoading,
  } = useAsync(async () => {
    if (quote?.tx && !loading) {
      return getPreExecResult({
        userAddress,
        chain,
        payToken,
        receiveToken,
        payAmount,
        quote,
        dexId: dexId as DEX_ENUM,
      });
    }
  }, [chain, dexId, payAmount, payToken, quote, receiveToken, userAddress]);

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
      !preExecTxLoading &&
      !preExecTxError &&
      !halfAmountQuoteError &&
      halfAmountQuotePreExecTxResult &&
      preExecTx
    ) {
      return (
        halfBetterRate(
          preExecTx?.swapPreExecTx,
          halfAmountQuotePreExecTxResult?.swapPreExecTx
        ) || ''
      );
    }
    return '';
  }, [
    active,
    preExecTxError,
    halfAmountQuoteError,
    halfAmountQuoteLoading,
    halfAmountQuotePreExecTxResult,
    preExecTx,
    preExecTxLoading,
  ]);

  const [middleContent, rightContent, disabled] = useMemo(() => {
    let center: React.ReactNode = <div className="ml-[66px]">-</div>;
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
      center = (
        <>
          <span className="toToken">
            {formatAmount(receivedTokeAmountBn.toString(10))}
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
    if (preExecTxError) {
      right = <div className="text-opacity-60">Unable to execute</div>;
      disable = true;
    }
    if (!isSdkDataPass) {
      disable = true;
      center = <div className="ml-[66px]">-</div>;
      right = (
        <div className="text-opacity-60">Security verification failed</div>
      );
    }
    return [center, right, disable];
  }, [
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    preExecTxError,
    isSdkDataPass,
    bestAmount,
    receiveToken.decimals,
    receiveToken.symbol,
    isBestQuote,
  ]);

  const quoteWarning = useMemo(() => {
    if (!quote?.toTokenAmount || !preExecTx?.swapPreExecTx) {
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
        preExecTx?.swapPreExecTx?.balance_change.receive_token_list[0]
          ?.amount || 0
      )
      .div(receivedTokeAmountBn)
      .times(100);

    return diff.gt(0.01) ? diff.toPrecision(2) : '';
  }, [
    chain,
    payToken.id,
    preExecTx?.swapPreExecTx,
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    receiveToken.decimals,
    receiveToken.id,
  ]);

  const CheckIcon = useCallback(() => {
    if (
      disabled ||
      preExecTxLoading ||
      loading ||
      !quote?.tx ||
      !preExecTx?.swapPreExecTx
    ) {
      return null;
    }
    return <WarningOrChecked quoteWarning={quoteWarning} />;
  }, [
    disabled,
    preExecTxLoading,
    loading,
    quote?.tx,
    preExecTx?.swapPreExecTx,
    quoteWarning,
  ]);

  const handleClick = useCallback(() => {
    if (active || disabled) return;
    onClick({
      name: dexId,
      quote,
      gasPrice: preExecTx?.gasPrice,
      shouldApproveToken: !!preExecTx?.shouldApproveToken,
      shouldTwoStepApprove: !!preExecTx?.shouldTwoStepApprove,
      error: !!preExecTxError,
      halfBetterRate: halfBetterRateString,
      quoteWarning,
    });
  }, [
    disabled,
    active,
    onClick,
    dexId,
    quote,
    preExecTx?.gasPrice,
    preExecTx?.shouldApproveToken,
    preExecTx?.shouldTwoStepApprove,
    preExecTxError,
    halfBetterRateString,
    quoteWarning,
  ]);

  useDebounce(
    () => {
      if (active) {
        onClick({
          name: dexId,
          quote,
          gasPrice: preExecTx?.gasPrice,

          shouldApproveToken: !!preExecTx?.shouldApproveToken,
          shouldTwoStepApprove: !!preExecTx?.shouldTwoStepApprove,
          error: !!preExecTxError,
          halfBetterRate: halfBetterRateString,
          quoteWarning,
        });
      }
    },
    300,
    [
      preExecTx?.gasPrice,
      quoteWarning,
      halfBetterRateString,
      active,
      preExecTxError,
      dexId,
      onClick,
      quote,
      preExecTx?.swapPreExecTx?.balance_change?.usd_value_change,
    ]
  );

  return (
    <ItemWrapper
      onClick={handleClick}
      className={clsx(active && 'active', disabled && 'disabled')}
    >
      <div className="info">
        <img className="logo" src={dexInfo.logo} />
        <span>{dexInfo.name}</span>
        {!!preExecTx?.shouldApproveToken && (
          <Tooltip title="Token is not approved for this aggregator">
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
    let center: React.ReactNode = <div className="ml-[66px]">-</div>;
    let right: React.ReactNode = '';
    let disable = false;

    if (!data?.receive_token?.amount) {
      right = <div className="text-opacity-60">Unable to fetch the price</div>;
      disable = true;
    }

    if (data?.receive_token?.amount) {
      const bestQuoteAmount = new BigNumber(bestAmount);
      const receiveToken = data.receive_token;
      const receivedTokeAmountBn = new BigNumber(receiveToken.amount).div(
        10 ** receiveToken.decimals
      );
      const percent = new BigNumber(receiveToken.amount)
        .minus(bestQuoteAmount || 0)
        .div(bestQuoteAmount)
        .times(100);
      center = (
        <>
          <span className="toToken">
            {formatAmount(receivedTokeAmountBn.toString(10))}
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

  const handleClick = () => {
    message.info(
      'CEX price is for reference only. Cannot be used for direct trading.'
    );
  };

  return (
    <ItemWrapper className={clsx('disabled')} onClick={handleClick}>
      <div className="info">
        <img className="logo" src={dexInfo.logo} />
        <span>{dexInfo.name}</span>
      </div>
      <div className="price">{middleContent}</div>
      <div className="diff">{rightContent}</div>
    </ItemWrapper>
  );
};

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
      list.sort((a, b) =>
        new BigNumber(
          (b.isDex ? b.data?.toTokenAmount : b?.data?.receive_token?.amount) ||
            0
        )
          .minus(
            (a.isDex
              ? a.data?.toTokenAmount
              : a?.data?.receive_token?.amount) || 0
          )
          .toNumber()
      ),
    [list]
  );
  return (
    <QuotesWrapper>
      <div className="header">
        <div className="title">The following swap rates are found</div>
        <IconRefresh refresh={refresh} />
      </div>
      {loading && (
        <div className="flex flex-col gap-[20px]">
          {Array(5)
            .fill(1)
            .map((_, i) => (
              <Skeleton.Input
                active
                block
                style={{ height: 72, borderRadius: '6px' }}
                key={`${_ + i}`}
              />
            ))}
        </div>
      )}
      <div className="flex flex-col gap-[20px]">
        {!loading &&
          sortedList.map(({ name, data, isDex }, idx) => {
            const bestQuote = sortedList?.[0];
            const bestAmount =
              (bestQuote?.isDex
                ? bestQuote?.data?.toTokenAmount
                : bestQuote.data?.receive_token.amount) || '0';
            if (isDex) {
              return (
                <DexQuoteItem
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
    </QuotesWrapper>
  );
};

// const failed = 'No price found';
// const cexTips =
//   'CEX price is for reference only. Cannot be used for direct trading.';

// const quoteFailed = 'Unable to fetch the price';

// const preExecTxFailed = 'Unable to execute';

// const securityVerificationFailed = 'Security verification failed';
