import { useMemo } from 'react';
import styled from 'styled-components';
import { Skeleton } from 'antd';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import {
  formatPrice,
  formatAmount,
  formatUsdValue,
} from '@/renderer/utils/number';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import clsx from 'clsx';
import { TokenActionSymbol } from '@/renderer/components/TokenActionModal/TokenActionModal';
import { getTokenSymbol } from '@/renderer/utils';
import BigNumber from 'bignumber.js';

const TokenItemWrapper = styled.li`
  font-size: 15px;
  line-height: 18px;
  color: #ffffff;
  display: flex;
  align-items: center;
  border-radius: 8px;
  border: 1px solid transparent;
  height: 63px;
  padding-left: 14px;
  padding-right: 14px;
  & > div {
    position: relative;
    text-align: left;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    .token-symbol {
      font-weight: 700;
      font-size: 15px;
      line-height: 18px;
      margin-left: 18px;
      white-space: nowrap;
      text-align: left;
      color: #ffffff;
    }
    .price-change {
      width: 100%;
      font-weight: 400;
      font-size: 10px;
      line-height: 12px;
      color: #c6c6c6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 4px;
      &.is-loss {
        color: #ff6565;
      }
      &.is-increase {
        color: #4aebbb;
      }
    }
    .number-change {
      opacity: 0;
      display: flex;
      font-weight: 500;
      font-size: 10px;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.7);
      align-items: center;
      margin-top: 4px;
      .icon-numer-change-arrow {
        width: 9px;
        margin-left: 4px;
        margin-right: 2px;
      }
    }
  }
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
    .token-actions {
      opacity: 1;
    }
  }
`;
const TokenLogoField = styled.div`
  display: flex;
  justify-content: flex-start;
  color: rgba(255, 255, 255, 0.8);
  width: 30%;
  .token-info {
    display: flex;
  }
  .token-actions {
    display: flex;
    opacity: 0;
    align-items: center;
    .icon {
      cursor: pointer;
      margin-left: 10px;
      width: 18px;
      height: 18px;

      &:hover {
        g {
          opacity: 1;
        }
        path {
          stroke: #8697ff;
        }
        rect {
          fill: #8697ff;
        }
      }
    }
  }
  .token-with-chain .chain-logo {
    width: 12px;
    height: 12px;
    bottom: -1px;
    right: -5px;
  }
`;
const TokenPriceField = styled.div`
  width: 24%;
  justify-content: flex-start;
`;
const TokenAmountField = styled.div`
  width: 29%;
  justify-content: flex-start;
  position: relative;
`;
const TokenUsdValueField = styled.div`
  width: 17%;
  justify-content: flex-end;
  font-weight: 700;
  position: relative;
  font-size: 15px;
  .price-change {
    display: block !important;
    text-align: right;
  }
`;

const TokenItemComp = ({
  token,
  historyToken,
  supportHistory,
  className,
  tokenClassName,
}: {
  token: TokenItem;
  historyToken?: TokenItem;
  supportHistory: boolean;
  className?: string;
  tokenClassName?: string;
}) => {
  const amountChange = useMemo(() => {
    if (!historyToken || !supportHistory) return 0;
    return token.amount - historyToken.amount;
  }, [token, historyToken, supportHistory]);

  const usdValueChange = useMemo(() => {
    if (!historyToken) {
      return {
        value: 0,
        percentage: 0,
      };
    }
    let historyAmount = historyToken.amount;
    if (!supportHistory) {
      historyAmount = token.amount;
    }
    const historyValue = historyAmount * historyToken.price;
    const valueChange =
      token.amount * token.price - historyAmount * historyToken.price;
    let percentage = valueChange === 0 ? 0 : valueChange / historyValue;
    if (historyAmount === 0 || historyValue === 0) {
      percentage = 1;
    }
    return {
      value: valueChange,
      percentage,
    };
  }, [token, historyToken, supportHistory]);

  return (
    <TokenItemWrapper
      className={clsx('td', className)}
      key={`${token.chain}-${token.id}`}
    >
      <TokenLogoField>
        <TokenWithChain token={token} width="24px" height="24px" />
        <TokenActionSymbol
          className={clsx('token-symbol', tokenClassName)}
          title={getTokenSymbol(token)}
          token={token}
        >
          {ellipsisTokenSymbol(getTokenSymbol(token))}
        </TokenActionSymbol>
        {/* <div className="token-actions">
          <Tooltip title="Swap">
            <IconSwap className="icon icon-swap" onClick={handleClickSwap} />
          </Tooltip>
          <Tooltip title="Send">
            <IconSend className="icon icon-send" onClick={handleClickSend} />
          </Tooltip>
          <Tooltip title="Receive">
            <IconReceive
              className="icon icon-receive"
              onClick={() => {
                onReceiveClick?.(token);
              }}
            />
          </Tooltip>
        </div> */}
      </TokenLogoField>
      <TokenPriceField>{`$${formatPrice(token.price || 0)}`}</TokenPriceField>
      <TokenAmountField>
        <span>
          {formatAmount(token.amount)}{' '}
          <TokenActionSymbol token={token}>
            {ellipsisTokenSymbol(getTokenSymbol(token))}
          </TokenActionSymbol>
        </span>
        {historyToken && Math.abs(amountChange * token.price) >= 0.01 && (
          <div
            className={classNames('price-change', {
              'is-loss': amountChange < 0,
              'is-increase': amountChange > 0,
            })}
          >
            {amountChange >= 0 ? '+' : '-'}
            {`${formatAmount(Math.abs(amountChange))} ${ellipsisTokenSymbol(
              getTokenSymbol(token)
            )} (${formatUsdValue(Math.abs(amountChange * token.price))})`}
          </div>
        )}
      </TokenAmountField>
      <TokenUsdValueField>
        {formatUsdValue(
          new BigNumber(token.price || 0).times(token.amount).toFixed()
        )}
        {historyToken && (
          <div
            className={classNames('price-change', {
              'is-loss': usdValueChange.value < 0,
              'is-increase': usdValueChange.value > 0,
            })}
          >
            {usdValueChange.value >= 0 ? '+' : '-'}
            {`${(Math.abs(usdValueChange.percentage) * 100).toFixed(
              2
            )}% (${formatUsdValue(Math.abs(usdValueChange.value))})`}
          </div>
        )}
      </TokenUsdValueField>
    </TokenItemWrapper>
  );
};

export const LoadingTokenItem = () => {
  return (
    <TokenItemWrapper className="td">
      <TokenLogoField>
        <Skeleton.Input
          active
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '24px',
          }}
        />
        <span className="token-symbol">
          <Skeleton.Input
            active
            style={{
              width: '63px',
              height: '20px',
              borderRadius: '2px',
            }}
          />
        </span>
      </TokenLogoField>
      <TokenPriceField>
        <Skeleton.Input
          active
          style={{
            width: '60px',
            height: '14px',
            borderRadius: '2px',
          }}
        />
        <div className="price-change">
          <Skeleton.Input
            active
            style={{
              width: '35px',
              height: '11px',
              borderRadius: '2px',
            }}
          />
        </div>
      </TokenPriceField>
      <TokenAmountField>
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '14px',
            borderRadius: '2px',
          }}
        />
        <div className="price-change">
          <Skeleton.Input
            active
            style={{
              width: '55px',
              height: '11px',
              borderRadius: '2px',
            }}
          />
        </div>
      </TokenAmountField>
      <TokenUsdValueField>
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '14px',
            borderRadius: '2px',
          }}
        />
      </TokenUsdValueField>
    </TokenItemWrapper>
  );
};

export default TokenItemComp;
