import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { Skeleton, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import {
  InsHTMLAttributes,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components';
import ImgVerified from '@/../assets/icons/swap/verified.svg';
import ImgWarning from '@/../assets/icons/swap/warning.svg';
import ImgInfo from '@/../assets/icons/swap/info-outline.svg';
import IconGas from '@/../assets/icons/swap/gas.svg';

import { formatAmount } from '@/renderer/utils/number';
import clsx from 'clsx';
import { SkeletonInputProps } from 'antd/lib/skeleton/Input';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import { getTokenSymbol } from '@/renderer/utils';
import { useAtomValue } from 'jotai';
import ImgLock from '@/../assets/icons/swap/lock.svg';
import { activeProviderAtom } from '../atom';

import { DEX } from '../constant';

const getQuoteLessWarning = ([receive, diff]: [string, string]) =>
  `The receiving amount is estimated from Rabby transaction simulation. The offer provided by dex is ${receive}. You'll receive ${diff}  less than the expected offer.`;

export const WarningOrChecked = ({
  quoteWarning,
}: {
  quoteWarning?: [string, string];
}) => {
  return (
    <Tooltip
      overlayClassName={clsx(
        'rectangle',
        quoteWarning ? 'max-w-[344px]' : 'max-w-[600px]'
      )}
      title={
        quoteWarning
          ? getQuoteLessWarning(quoteWarning)
          : 'By transaction simulation, the quote is valid'
      }
    >
      <img
        src={quoteWarning ? ImgWarning : ImgVerified}
        className="w-[14px] h-[14px]"
      />
    </Tooltip>
  );
};

const ReceiveWrapper = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 16px;
  padding-top: 20px;
  font-size: 18px;
  color: white;

  .rateBox {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 0.5px solid rgba(255, 255, 255, 0.1);
  }

  .rate {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  .diffPercent {
    &.negative {
      color: #ff7878;
    }
    &.positive {
      color: #27c193;
    }
  }
  .column {
    display: flex;
    justify-content: space-between;
    + .column {
      margin-top: 16px;
    }

    .right {
      font-weight: medium;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      img {
        width: 14px;
        height: 14px;
      }
    }
  }

  .warning {
    margin: 10px 0;
    padding: 10px;
    background: rgba(255, 219, 92, 0.1);
    border-radius: 4px;
    font-size: 13px;
    line-height: 16px;
    color: #ffdb5c;
    position: relative;
  }
  .ellipsis {
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const SkeletonChildren = (
  props: PropsWithChildren<SkeletonInputProps & { loading?: boolean }>
) => {
  const { loading = true, children, ...other } = props;
  if (loading) {
    return (
      <Skeleton.Input
        active
        {...other}
        style={{
          borderRadius: '6px',
          ...other.style,
        }}
      />
    );
  }
  return <div className="flex items-center gap-6">{children}</div>;
};

interface ReceiveDetailsProps {
  payAmount: string | number;
  receiveRawAmount: string | number;
  payToken: TokenItem;
  receiveToken: TokenItem;
  receiveTokenDecimals?: number;
  quoteWarning?: [string, string];
  loading?: boolean;
  isWrapToken: boolean;
}
export const ReceiveDetails = (
  props: ReceiveDetailsProps & InsHTMLAttributes<HTMLDivElement>
) => {
  const {
    isWrapToken,
    receiveRawAmount: receiveAmount,
    payAmount,
    payToken,
    receiveToken,
    receiveTokenDecimals,
    quoteWarning,
    loading = false,
    ...other
  } = props;

  const [reverse, setReverse] = useState(false);

  const reverseRate = useCallback(() => {
    setReverse((e) => !e);
  }, []);

  useEffect(() => {
    if (payToken && receiveToken) {
      setReverse(false);
    }
  }, [receiveToken, payToken]);

  const { receiveNum, payUsd, receiveUsd, rate, diff, sign, showLoss } =
    useMemo(() => {
      const pay = new BigNumber(payAmount).times(payToken.price || 0);
      const receiveAll = new BigNumber(receiveAmount);
      const receive = receiveAll.times(receiveToken.price || 0);
      const cut = receive.minus(pay).div(pay).times(100);
      const rateBn = new BigNumber(reverse ? payAmount : receiveAll).div(
        reverse ? receiveAll : payAmount
      );

      return {
        receiveNum: formatAmount(receiveAll.toString(10)),
        payUsd: formatAmount(pay.toString(10)),
        receiveUsd: formatAmount(receive.toString(10)),
        rate: rateBn.lt(0.0001)
          ? new BigNumber(rateBn.toPrecision(1, 0)).toString(10)
          : formatAmount(rateBn.toString(10)),
        sign: cut.eq(0) ? '' : cut.lt(0) ? '-' : '+',
        diff: cut.abs().toFixed(2),
        showLoss: cut.lte(-5),
      };
    }, [payAmount, payToken.price, receiveAmount, receiveToken.price, reverse]);

  const activeProvider = useAtomValue(activeProviderAtom);

  return (
    <ReceiveWrapper {...other}>
      <div className="column">
        <div className="flex w-full items-center">
          <img
            className={clsx('rounded-full w-32 h-32 min-w-[32px] mr-12')}
            src={
              isWrapToken
                ? receiveToken?.logo_url
                : DEX?.[activeProvider?.name as keyof typeof DEX]?.logo
            }
          />
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white text-opacity-80">
                <span>
                  {isWrapToken
                    ? 'Wrap Contract'
                    : DEX?.[activeProvider?.name as keyof typeof DEX]?.name}
                </span>
                {!!activeProvider?.shouldApproveToken && (
                  <Tooltip
                    overlayClassName="rectangle max-w-[300px]"
                    title="Need to approve token before swap"
                  >
                    <img src={ImgLock} className="w-14 h-14" />
                  </Tooltip>
                )}
              </div>
              <SkeletonChildren
                loading={loading}
                style={{ maxWidth: 144, height: 20, opacity: 0.5 }}
              >
                <span
                  title={`${receiveNum} ${getTokenSymbol(receiveToken)}`}
                  className="ellipsis"
                >
                  {receiveNum} {getTokenSymbol(receiveToken)}
                </span>
                <WarningOrChecked quoteWarning={quoteWarning} />
              </SkeletonChildren>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-13 text-white text-opacity-80">
                <img src={IconGas} className="w-14 h-14 relative top-[-1px]" />
                <SkeletonChildren
                  loading={loading}
                  style={{ maxWidth: 60, height: 20, opacity: 0.5 }}
                >
                  <span>{activeProvider?.gasUsd}</span>
                </SkeletonChildren>
              </div>
              <div
                className={clsx(
                  'flex justify-end items-center gap-6 text-[13px] text-white text-opacity-80',
                  loading && 'opacity-0'
                )}
              >
                <span className="ellipsis">
                  ${receiveUsd} (
                  <span
                    className={clsx(
                      'diffPercent',
                      sign === '+' && 'positive',
                      sign === '-' && 'negative'
                    )}
                  >
                    {sign}
                    {diff}%
                  </span>
                  )
                </span>
                <Tooltip
                  overlayClassName="rectangle max-w-[600px]"
                  title={
                    <div className="flex flex-col gap-4 py-[5px] text-13">
                      <div>
                        Est. Payment: {payAmount}
                        {getTokenSymbol(payToken)} ≈ ${payUsd}
                      </div>
                      <div>
                        Est. Receiving: {receiveNum}
                        {getTokenSymbol(receiveToken)} ≈ ${receiveUsd}
                      </div>
                      <div>
                        Est. Difference: {sign}
                        {diff}%
                      </div>
                    </div>
                  }
                >
                  <img src={ImgInfo} />
                </Tooltip>
              </div>
            </div>
            <div />
          </div>
        </div>
      </div>

      {!loading && quoteWarning && (
        <div className="warning">{getQuoteLessWarning(quoteWarning)}</div>
      )}

      {!loading && showLoss && (
        <div className="warning rate">
          Selected offer differs greatly from current rate, may cause big losses
        </div>
      )}

      <div className="column rateBox">
        <span className="rate">Rate</span>
        <div className="right text-14">
          <SkeletonChildren
            loading={loading}
            style={{ maxWidth: 182, height: 20, opacity: 0.5 }}
          >
            <span className="cursor-pointer ellipsis" onClick={reverseRate}>
              <span
                title={`${1} ${
                  reverse
                    ? getTokenSymbol(receiveToken)
                    : getTokenSymbol(payToken)
                }`}
              >
                1{' '}
                {ellipsisTokenSymbol(
                  reverse
                    ? getTokenSymbol(receiveToken)
                    : getTokenSymbol(payToken)
                )}{' '}
              </span>
              ={' '}
              <span
                title={`${rate} ${
                  reverse
                    ? getTokenSymbol(payToken)
                    : getTokenSymbol(receiveToken)
                }`}
              >
                {rate}{' '}
                {ellipsisTokenSymbol(
                  reverse
                    ? getTokenSymbol(payToken)
                    : getTokenSymbol(receiveToken)
                )}
              </span>
            </span>
          </SkeletonChildren>
        </div>
      </div>
    </ReceiveWrapper>
  );
};
