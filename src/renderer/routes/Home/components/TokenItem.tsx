import { useMemo } from 'react';
import styled from 'styled-components';
import { TokenItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import { formatNumber } from '@/renderer/utils/number';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import { showMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
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
    text-align: right;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    .token-symbol {
      font-weight: 700;
      font-size: 14px;
      line-height: 18px;
      margin-left: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      text-align: left;
    }
    .price-change {
      width: 100%;
      font-weight: 400;
      font-size: 10px;
      line-height: 12px;
      color: #2ed4a3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &.is-loss {
        color: #ff6060;
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
    border-color: #757f95;
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
    background: linear-gradient(90.98deg, #5e626b 1.39%, #4d515f 97.51%);
    .number-change {
      opacity: 1;
    }
    .token-actions {
      opacity: 1;
    }
  }
`;
const TokenLogoField = styled.div`
  justify-content: flex-start;
  color: rgba(255, 255, 255, 0.8);
  width: 17%;
  .token-info {
    display: flex;
  }
  .token-actions {
    width: 100%;
    display: flex;
    padding-left: 42px;
    opacity: 0;
    align-items: center;
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
  width: 22%;
  justify-content: flex-end;
`;
const TokenAmountField = styled.div`
  width: 38%;
  justify-content: flex-end;
`;
const TokenUsdValueField = styled.div`
  width: 23%;
  justify-content: flex-end;
`;

const TokenItemComp = ({
  token,
  historyToken,
}: {
  token: TokenItem;
  historyToken?: TokenItem;
}) => {
  const priceChange = useMemo(() => {
    if (!historyToken) return 0;
    if (historyToken.price === 0) return token.price;
    return (token.price - historyToken.price) / historyToken.price;
  }, [token, historyToken]);

  const amountChange = useMemo(() => {
    if (!historyToken) return 0;
    return token.amount - historyToken.amount;
  }, [token, historyToken]);

  const usdValueChange = useMemo(() => {
    if (!historyToken) return 0;
    return (
      token.amount * token.price - historyToken.amount * historyToken.price
    );
  }, [token, historyToken]);

  const handleClickSwap = () => {
    showMainwinPopupview(
      {
        type: 'quick-swap',
        state: { payTokenId: token.id, chain: token.chain },
      },
      { openDevTools: false }
    );
  };

  return (
    <TokenItemWrapper className="td" key={`${token.chain}-${token.id}`}>
      <TokenLogoField>
        <TokenWithChain token={token} width="24px" height="24px" />
        <span className="token-symbol">{token.symbol}</span>
        <div className="token-actions">
          <IconSwap className="icon icon-swap" onClick={handleClickSwap} />
          <IconSend className="icon icon-send" />
          <IconReceive className="icon icon-receive" />
        </div>
      </TokenLogoField>
      <TokenPriceField>
        {historyToken && (
          <div className="number-change">
            ${formatNumber(historyToken.price)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        {`$${formatNumber(token.price)}`}
        {priceChange !== 0 && (
          <div
            className={classNames('price-change', {
              'is-loss': priceChange < 0,
            })}
          >
            {priceChange > 0 ? '+' : '-'}
            {Math.abs(priceChange * 100).toFixed(2)}%
          </div>
        )}
      </TokenPriceField>
      <TokenAmountField>
        {historyToken && (
          <div className="number-change">
            {formatNumber(historyToken.amount, 4)}{' '}
            {ellipsisTokenSymbol(token.symbol)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        {formatNumber(token.amount, 4)} {ellipsisTokenSymbol(token.symbol)}
        {amountChange !== 0 && (
          <div
            className={classNames('price-change', {
              'is-loss': amountChange < 0,
            })}
          >
            {amountChange > 0 ? '+' : '-'}
            {`${Math.abs(amountChange).toFixed(4)} ${ellipsisTokenSymbol(
              token.symbol
            )}`}
          </div>
        )}
      </TokenAmountField>
      <TokenUsdValueField>
        {historyToken && (
          <div className="number-change">
            ${formatNumber(historyToken.usd_value || 0)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        {`$${formatNumber(token.usd_value || '0')}`}
        {usdValueChange !== 0 && (
          <div
            className={classNames('price-change', {
              'is-loss': usdValueChange < 0,
            })}
          >
            {usdValueChange > 0 ? '+' : '-'}$
            {Math.abs(usdValueChange).toFixed(2)}
          </div>
        )}
      </TokenUsdValueField>
    </TokenItemWrapper>
  );
};

export default TokenItemComp;
