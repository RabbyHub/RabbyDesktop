import { TokenItem } from '@debank/rabby-api/dist/types';
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
import { formatAmount } from '@/renderer/utils/number';
import clsx from 'clsx';
import { SkeletonInputProps } from 'antd/lib/skeleton/Input';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';

const getQuoteLessWarning = (quoteWarning: string) =>
  `By transaction simulation, you'll receive ${quoteWarning} less than the current offer.`;

export const WarningOrChecked = ({
  quoteWarning: diffWarning,
}: {
  quoteWarning?: string;
}) => {
  return (
    <Tooltip
      overlayClassName="rectangle max-w-[600px]"
      title={
        diffWarning
          ? getQuoteLessWarning(diffWarning)
          : 'By transaction simulation, the quote is valid'
      }
    >
      <img
        src={diffWarning ? ImgWarning : ImgVerified}
        className="w-[14px] h-[14px]"
      />
    </Tooltip>
  );
};

const ReceiveWrapper = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 20px 16px;
  font-size: 16px;
  color: white;
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
      .receive {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      img {
        width: 14px;
        height: 14px;
      }
      .diffPercent {
        &.negative {
          color: #ff7878;
        }
        &.positive {
          color: #27c193;
        }
      }
    }
  }

  .warning {
    margin: 10px 0;
    padding: 10px;
    /* padding-right: 16px; */
    background: rgba(255, 219, 92, 0.1);
    border-radius: 4px;
    font-size: 13px;
    line-height: 16px;
    color: #ffdb5c;
    position: relative;

    &:after {
      position: absolute;
      top: -8px;
      right: 4px;
      /* transform: translateX(-50%); */
      content: '';
      width: 0;
      height: 0;
      border-width: 0 4px 8px 4px;
      border-color: transparent transparent rgba(255, 219, 92, 0.1) transparent;
      border-style: solid;
    }

    &.rate:after {
      right: 44px;
    }
  }
`;

const SkeletonChildren = (
  props: PropsWithChildren<SkeletonInputProps & { loading?: boolean }>
) => {
  const { loading = true, children, ...other } = props;
  if (loading) {
    return <Skeleton.Input active {...other} />;
  }
  return <>{children}</>;
};

interface ReceiveDetailsProps {
  payAmount: string | number;
  receiveRawAmount: string | number;
  payToken: TokenItem;
  receiveToken: TokenItem;
  receiveTokenDecimals?: number;
  quoteWarning?: string;
  loading?: boolean;
}
export const ReceiveDetails = (
  props: ReceiveDetailsProps & InsHTMLAttributes<HTMLDivElement>
) => {
  const {
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
      const pay = new BigNumber(payAmount).times(payToken.price);
      const receiveAll = new BigNumber(receiveAmount).div(
        10 ** (receiveTokenDecimals || receiveToken.decimals)
      );
      const receive = receiveAll.times(receiveToken.price);
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
    }, [
      payAmount,
      payToken.price,
      receiveAmount,
      receiveToken.decimals,
      receiveToken.price,
      receiveTokenDecimals,
      reverse,
    ]);

  return (
    <ReceiveWrapper {...other}>
      <div className="column">
        <span>Receive amount</span>
        <div className="right">
          <SkeletonChildren
            loading={loading}
            style={{ maxWidth: 144, height: 20, opacity: 0.5 }}
          >
            <span
              title={`${receiveNum} ${receiveToken.symbol}`}
              className="receive"
            >
              {receiveNum} {receiveToken.symbol}
            </span>
            <WarningOrChecked quoteWarning={quoteWarning} />
          </SkeletonChildren>
        </div>
      </div>
      {!loading && quoteWarning && (
        <div className="warning">{getQuoteLessWarning(quoteWarning)}</div>
      )}

      <div className="column">
        <span>Rate</span>
        <div className="right">
          <SkeletonChildren
            loading={loading}
            style={{ maxWidth: 182, height: 20, opacity: 0.5 }}
          >
            <span className="cursor-pointer" onClick={reverseRate}>
              <span
                title={`${1} ${
                  reverse ? receiveToken.symbol : payToken.symbol
                }`}
              >
                1{' '}
                {ellipsisTokenSymbol(
                  reverse ? receiveToken.symbol : payToken.symbol
                )}{' '}
              </span>
              ={' '}
              <span
                title={`${rate} ${
                  reverse ? payToken.symbol : receiveToken.symbol
                }`}
              >
                {rate}{' '}
                {ellipsisTokenSymbol(
                  reverse ? payToken.symbol : receiveToken.symbol
                )}
              </span>
              (
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
                <div className="flex flex-col gap-2">
                  <div>
                    Est. Payment: {payAmount}
                    {payToken.symbol} ≈ ${payUsd}
                  </div>
                  <div>
                    Est. Receiving: {receiveNum}
                    {receiveToken.symbol} ≈ ${receiveUsd}
                  </div>
                  <div>Est. Difference: {diff}%</div>
                </div>
              }
            >
              <img src={ImgInfo} />
            </Tooltip>
          </SkeletonChildren>
        </div>
      </div>

      {!loading && showLoss && (
        <div className="warning rate">
          Selected offer differs greatly from current rate, may cause big losses
        </div>
      )}
    </ReceiveWrapper>
  );
};
