import { useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Skeleton } from 'antd';
import { TokenItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import {
  formatNumber,
  formatPrice,
  formatAmount,
  formatUsdValue,
} from '@/renderer/utils/number';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import { useGotoSwapByToken } from '@/renderer/hooks/rabbyx/useSwap';
import { useNavigate } from 'react-router-dom';
import IconSwap from '../../../../../assets/icons/home/token-swap.svg?rc';
import IconSend from '../../../../../assets/icons/home/token-send.svg?rc';
import IconReceive from '../../../../../assets/icons/home/token-receive.svg?rc';

const TokenItemWrapper = styled.li`
  font-weight: 500;
  font-size: 13px;
  line-height: 18px;
  color: #ffffff;
  height: 60px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 0 23px;
  border: 1px solid transparent;
  & > div {
    position: relative;
    text-align: left;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    .token-symbol {
      font-weight: 700;
      font-size: 14px;
      line-height: 18px;
      margin-left: 18px;
      white-space: nowrap;
      text-align: left;
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
      &.is-loss {
        color: #ff6060;
      }
      &.is-increase {
        color: #2ed4a3;
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
      .icon-numer-change-arrow {
        width: 9px;
        margin-left: 4px;
        margin-right: 2px;
      }
    }
  }
  &:hover {
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
    margin-left: 8px;
    .icon {
      cursor: pointer;
      margin-right: 14px;
      width: 10px;
      height: 10px;
      &.icon-swap {
        width: 15px;
        height: 15px;
      }
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
`;
const TokenPriceField = styled.div`
  width: 24%;
  justify-content: flex-start;
`;
const TokenAmountField = styled.div`
  width: 29%;
  justify-content: flex-start;
`;
const TokenUsdValueField = styled.div`
  width: 17%;
  justify-content: flex-end;
  .price-change {
    display: block !important;
    text-align: right;
  }
`;

const TokenItemComp = ({
  token,
  historyToken,
  supportHistory,
  onReceiveClick,
}: {
  token: TokenItem;
  historyToken?: TokenItem;
  supportHistory: boolean;
  onReceiveClick?: (token: TokenItem) => void;
}) => {
  const navigate = useNavigate();

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
    return {
      value: valueChange,
      percentage: valueChange === 0 ? 0 : valueChange / historyValue,
    };
  }, [token, historyToken, supportHistory]);
  const gotoSwap = useGotoSwapByToken();

  const handleClickSwap = useCallback(() => {
    gotoSwap(token.chain, token.id);
  }, [gotoSwap, token.chain, token.id]);

  const handleClickSend = useCallback(() => {
    navigate(`/mainwin/send-token?token=${token?.chain}:${token?.id}`);
  }, [navigate, token?.chain, token?.id]);

  return (
    <TokenItemWrapper className="td" key={`${token.chain}-${token.id}`}>
      <TokenLogoField>
        <TokenWithChain token={token} width="24px" height="24px" />
        <span className="token-symbol" title={token.symbol}>
          {ellipsisTokenSymbol(token.symbol)}
        </span>
        <div className="token-actions">
          <IconSwap className="icon icon-swap" onClick={handleClickSwap} />
          <IconSend className="icon icon-send" onClick={handleClickSend} />
          <IconReceive
            className="icon icon-receive"
            onClick={() => {
              onReceiveClick?.(token);
            }}
          />
        </div>
      </TokenLogoField>
      <TokenPriceField>{`$${formatPrice(token.price)}`}</TokenPriceField>
      <TokenAmountField>
        {formatAmount(token.amount)} {ellipsisTokenSymbol(token.symbol)}
        {historyToken && Math.abs(amountChange * token.price) >= 0.01 && (
          <div
            className={classNames('price-change', {
              'is-loss': amountChange < 0,
              'is-increase': amountChange > 0,
            })}
          >
            {amountChange >= 0 ? '+' : '-'}
            {`${formatNumber(Math.abs(amountChange))} ${ellipsisTokenSymbol(
              token.symbol
            )} (${formatUsdValue(Math.abs(amountChange * token.price))})`}
          </div>
        )}
      </TokenAmountField>
      <TokenUsdValueField>
        {`${formatUsdValue(token.usd_value || '0')}`}
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
