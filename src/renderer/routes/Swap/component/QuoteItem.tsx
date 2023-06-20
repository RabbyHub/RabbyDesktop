import { useMemo, useCallback } from 'react';
import { CEXQuote, TokenItem } from '@debank/rabby-api/dist/types';
import { QuoteResult } from '@rabby-wallet/rabby-swap/dist/quote';
import { Tooltip } from 'antd';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import clsx from 'clsx';
import { CHAINS_ENUM } from '@debank/common';
import { DEX_ENUM } from '@rabby-wallet/rabby-swap';
import { useDebounce } from 'react-use';
import ImgLock from '@/../assets/icons/swap/lock.svg';
import IconRcTip from '@/../assets/icons/swap/tip-info.svg?rc';
import IconGas from '@/../assets/icons/swap/gas.svg';

import { useSetAtom } from 'jotai';
import { getTokenSymbol } from '@/renderer/utils';
import { CEX } from '../constant';
import { QuotePreExecResultInfo, isSwapWrapToken } from '../utils';
import { WarningOrChecked } from './ReceiveDetail';
import { useSwapSettings, useVerifySdk } from '../hooks';
import { activeProviderOriginAtom } from '../atom';
import { QuoteLogo } from './QuoteLogo';

const ItemWrapper = styled.div`
  position: relative;
  height: 72px;
  font-size: 16px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  outline: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 6px;

  cursor: pointer;

  .disabled-trade {
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
    /* &.active {
      height: 100%;
      transform: translateY(0);
      opacity: 1;
      transition: opacity 0.35s, transform 0.35s;
    } */
  }

  &:hover {
    .disabled-trade {
      height: 100%;
      transform: translateY(0);
      opacity: 1;
    }
  }

  &:hover:not(.disabled, .inSufficient) {
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
    height: 56px;
    border-color: transparent;
    box-shadow: none;
    background-color: transparent;
    border-radius: 6px;
    cursor: not-allowed;
  }
  &.error {
    & > * {
      opacity: 0.6;
    }
  }
  &.inSufficient {
    height: 72px;
  }

  &.cex {
    height: 56px;
    background-color: transparent;
    border: none;
    outline: none;
  }

  .price {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    .receiveNum {
      max-width: 210px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.8);
      .toToken {
        color: #fff;
      }
    }
  }
  .no-price {
    color: rgba(255, 255, 255, 0.6);
  }

  .percent {
    font-weight: 500;
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
  isLoading?: boolean;
  quoteProviderInfo: { name: string; logo: string };
  inSufficient: boolean;
}

export const DexQuoteItem = (
  props: QuoteItemProps & {
    preExecResult: QuotePreExecResultInfo;
  }
) => {
  const {
    isLoading,
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
    inSufficient,
    preExecResult,
    quoteProviderInfo,
  } = props;

  const { swapTradeList, setSwapSettingVisible } = useSwapSettings();

  const disabledTrade = useMemo(
    () =>
      !swapTradeList?.[dexId as Exclude<DEX_ENUM, DEX_ENUM.WRAPTOKEN>] &&
      !isSwapWrapToken(payToken.id, receiveToken.id, chain),
    [swapTradeList, dexId, payToken.id, receiveToken.id, chain]
  );

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

  const halfBetterRateString = '';

  const [
    middleContent,
    rightContent,
    disabled,
    receivedTokenUsd,
    diffReceivedTokenUsd,
  ] = useMemo(() => {
    let center: React.ReactNode = <div className="">-</div>;
    let right: React.ReactNode = '';
    let disable = false;
    let receivedUsd = '0';
    let diffUsd = '0';

    const actualReceiveAmount = inSufficient
      ? new BigNumber(quote?.toTokenAmount || 0)
          .div(10 ** (quote?.toTokenDecimals || receiveToken.decimals))
          .toString()
      : preExecResult?.swapPreExecTx.balance_change.receive_token_list[0]
          ?.amount;
    if (actualReceiveAmount) {
      const bestQuoteAmount = new BigNumber(bestAmount);
      const receivedTokeAmountBn = new BigNumber(actualReceiveAmount || 0);
      const percent = new BigNumber(actualReceiveAmount)
        .minus(bestAmount || 0)
        .div(bestAmount)
        .times(100);

      receivedUsd = formatUsdValue(
        receivedTokeAmountBn.times(receiveToken.price || 0).toString(10)
      );

      diffUsd = formatUsdValue(
        new BigNumber(actualReceiveAmount)
          .minus(bestQuoteAmount || 0)
          .times(receiveToken.price || 0)
          .toString(10)
      );

      const s = formatAmount(receivedTokeAmountBn.toString(10));
      center = (
        <span
          className="receiveNum"
          title={`${s} ${getTokenSymbol(receiveToken)}`}
        >
          <span className="toToken" title={s}>
            {s}
          </span>{' '}
          {getTokenSymbol(receiveToken)}
        </span>
      );

      right = (
        <span className={clsx('percent', percent.lt(0) && 'red')}>
          {isBestQuote
            ? 'Best'
            : `${percent.toFixed(2, BigNumber.ROUND_DOWN)}%`}
        </span>
      );
    }

    if (!quote?.toTokenAmount) {
      right = <div className="text-opacity-60">Unable to fetch the price</div>;
      center = <div className="">-</div>;
      disable = true;
    }

    if (quote?.toTokenAmount) {
      if (!preExecResult && !inSufficient) {
        center = <div className="">-</div>;
        right = (
          <div className="text-opacity-60">Fail to simulate transaction</div>
        );
        disable = true;
      }
    }

    if (!isSdkDataPass) {
      disable = true;
      center = <div className="">-</div>;
      right = (
        <div className="text-opacity-60">Security verification failed</div>
      );
    }
    return [center, right, disable, receivedUsd, diffUsd];
  }, [
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    inSufficient,
    receiveToken,
    preExecResult,
    isSdkDataPass,
    bestAmount,
    isBestQuote,
  ]);

  const quoteWarning = useMemo(() => {
    if (!quote?.toTokenAmount || !preExecResult) {
      return;
    }

    if (isSwapWrapToken(payToken.id, receiveToken.id, chain)) {
      return;
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
      ? ([
          formatAmount(receivedTokeAmountBn.toString(10)) +
            getTokenSymbol(receiveToken),
          `${diffPercent.toPrecision(2)}% (${formatAmount(
            receivedTokeAmountBn
              .minus(
                preExecResult?.swapPreExecTx?.balance_change
                  .receive_token_list[0]?.amount || 0
              )
              .toString(10)
          )} ${getTokenSymbol(receiveToken)})`,
        ] as [string, string])
      : undefined;
  }, [
    chain,
    payToken.id,
    preExecResult,
    quote?.toTokenAmount,
    quote?.toTokenDecimals,
    receiveToken,
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
    if (inSufficient || disabledTrade) {
      return;
    }
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
      actualReceiveAmount:
        preExecResult?.swapPreExecTx.balance_change.receive_token_list[0]
          ?.amount || '',
    });
  }, [
    active,
    disabled,
    inSufficient,
    updateActiveQuoteProvider,
    dexId,
    quote,
    preExecResult,
    quoteWarning,
    disabledTrade,
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
          actualReceiveAmount:
            preExecResult?.swapPreExecTx.balance_change.receive_token_list[0]
              ?.amount || '',
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

  const isWrapTokensWap = useMemo(
    () => isSwapWrapToken(payToken.id, receiveToken.id, chain),
    [payToken, receiveToken, chain]
  );

  return (
    <ItemWrapper
      onClick={handleClick}
      className={clsx(
        active && 'active',
        disabled && 'disabled error',
        (disabledTrade || inSufficient) && !disabled && 'disabled inSufficient'
      )}
    >
      <QuoteLogo
        size={disabled ? 24 : 32}
        loadingSize={disabled ? 32 : 40}
        logo={quoteProviderInfo.logo}
        isLoading={isLoading}
      />

      <div className="flex flex-col justify-center ml-12 flex-1 text-16  text-white ">
        <div className="flex items-center">
          <div
            className={clsx(
              'flex items-center gap-4 w-[122px] text-white text-opacity-80',
              isWrapTokensWap && 'mr-[42px]'
            )}
          >
            <span
              className={clsx(inSufficient && !disabled && 'relative top-14')}
            >
              {quoteProviderInfo.name}
            </span>
            {!!preExecResult?.shouldApproveToken && (
              <Tooltip
                overlayClassName="rectangle max-w-[300px]"
                title="Need to approve token before swap"
              >
                <img src={ImgLock} className="w-14 h-14" />
              </Tooltip>
            )}
          </div>

          <div className="flex flex-col">
            <div className="price">
              {middleContent}
              <CheckIcon />
            </div>
          </div>
          {!isBestQuote && <div className="diff">{rightContent}</div>}
        </div>

        {!disabled && (
          <div className="flex items-center text-13 text-white text-opacity-80 mt-4">
            <div
              className={clsx(
                'flex items-center gap-4 w-[122px]',
                isWrapTokensWap && 'mr-[42px]'
              )}
            >
              {!inSufficient && (
                <>
                  <img
                    src={IconGas}
                    className="w-14 h-14 relative top-[-1px]"
                  />
                  <span>{preExecResult?.gasUsd}</span>
                </>
              )}
            </div>

            <span>{receivedTokenUsd}</span>

            {!isBestQuote && (
              <span className="ml-auto text-right">{diffReceivedTokenUsd}</span>
            )}
          </div>
        )}
      </div>

      {isBestQuote && <div className="diff">{rightContent}</div>}

      {disabledTrade && !inSufficient && !disabled ? (
        <div className={clsx('disabled-trade')}>
          <IconRcTip className="w-16 h-16" />
          <span>
            This exchange is not enabled to trade by you.
            <span
              className="underline-white underline cursor-pointer ml-4"
              onClick={(e) => {
                e.stopPropagation();
                setSwapSettingVisible(true);
              }}
            >
              Enable it
            </span>
          </span>
        </div>
      ) : null}
    </ItemWrapper>
  );
};

export const CexQuoteItem = (props: {
  name: string;
  data: CEXQuote | null;
  bestAmount: string;
  isBestQuote: boolean;
  isLoading?: boolean;
  inSufficient: boolean;
}) => {
  const { name, data, bestAmount, isBestQuote, isLoading, inSufficient } =
    props;
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
        .minus(bestQuoteAmount || 0)
        .div(bestQuoteAmount)
        .times(100);
      const s = formatAmount(receiveToken.amount.toString(10));
      center = (
        <span
          className="receiveNum"
          title={`${s} ${getTokenSymbol(receiveToken)}`}
        >
          <span className="toToken" title={s}>
            {s}
          </span>{' '}
          {getTokenSymbol(receiveToken)}
        </span>
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

  return (
    <ItemWrapper
      className={clsx('cex disabled', !data?.receive_token?.amount && 'error')}
    >
      <QuoteLogo logo={dexInfo.logo} isLoading={isLoading} />

      <div className="flex flex-col justify-center ml-12 flex-1 text-16  text-white ">
        <div className="flex items-center">
          <div
            className={clsx(
              'flex items-center gap-4 w-[122px] text-white text-opacity-80'
            )}
          >
            <span>{dexInfo.name}</span>
          </div>

          <div className="flex flex-col">
            <div className="price">{middleContent}</div>
          </div>
          <div className="diff">{rightContent}</div>
        </div>
      </div>
    </ItemWrapper>
  );
};

export const CexListWrapper = styled.div`
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  & > div:not(:last-child) {
    position: relative;
    &:not(:last-child):before {
      content: '';
      position: absolute;
      width: 440px;
      height: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      left: 20px;
      bottom: 0;
    }
  }
`;
