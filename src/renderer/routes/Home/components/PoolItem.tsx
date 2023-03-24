import { useMemo } from 'react';
import styled from 'styled-components';
import { Skeleton } from 'antd';
import { PortfolioItem, TokenItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import {
  formatAmount,
  formatPrice,
  formatUsdValue,
} from '@/renderer/utils/number';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';

const PoolItemWrapper = styled.div`
  padding: 25px 25px 0 25px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  position: relative;
  margin-bottom: 12px;
  padding-top: 40px;
  padding-bottom: 24px;
  .tag {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(255, 255, 255, 0.12);
    font-size: 12px;
    line-height: 14px;
    color: #ffffff;
    padding: 5px 22px;
    text-align: center;
    top: 0;
    left: 0;
    border-top-left-radius: 12px;
    border-bottom-right-radius: 4px;
  }
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
  &:hover {
    .pool-item-footer {
      display: flex;
    }
    .number-change {
      opacity: 1;
    }
    .token-price .price-change,
    .token-amount .price-change {
      display: block;
    }
  }
`;

const TokenItemWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 22px;
  .token-symbol {
    display: flex;
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
    color: #ffffff;
    width: 30%;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
    .symbol {
      margin-left: 16px;
    }
  }
  .token-price {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    width: 24%;
    font-weight: 500;
    font-size: 14px;
    line-height: 14px;
    color: #ffffff;
  }
  .price-change {
    width: 100%;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    color: #c6c6c6;
    text-align: left;
    &.is-loss {
      color: #ff6565;
    }
    &.is-increase {
      color: #4aebbb;
    }
  }
  .token-amount {
    width: 29%;
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    font-weight: 500;
    font-size: 14px;
    line-height: 17px;
  }
  .token-usd-value {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    width: 17%;
    font-weight: 700;
    font-size: 14px;
    line-height: 17px;
    text-align: right;
    .price-change {
      display: block;
      text-align: right;
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
  .debt-tag {
    border: 1px solid #ff6565;
    border-radius: 4px;
    padding: 2px 5px;
    font-weight: 700;
    font-size: 10px;
    line-height: 12px;
    text-transform: uppercase;
    color: #ff6565;
    margin-left: 6px;
  }
  &:nth-last-child(1) {
    margin-bottom: 0;
  }
`;

const LoadingTokenItem = () => {
  return (
    <TokenItemWrapper>
      <div className="token-symbol">
        <Skeleton.Input
          active
          style={{
            width: '19px',
            height: '19px',
            borderRadius: '19px',
          }}
        />
        <div className="symbol">
          <Skeleton.Input
            active
            style={{
              width: '63px',
              height: '17px',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
      <div className="token-price">
        <Skeleton.Input
          active
          style={{
            width: '60px',
            height: '12px',
            borderRadius: '2px',
          }}
        />

        <div className="price-change">
          <Skeleton.Input
            active
            style={{
              width: '35px',
              height: '9px',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
      <div className="token-amount">
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '12px',
            borderRadius: '2px',
          }}
        />
        <div className="price-change">
          <Skeleton.Input
            active
            style={{
              width: '55px',
              height: '9px',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
      <div className="token-usd-value">
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '12px',
            borderRadius: '2px',
          }}
        />
      </div>
    </TokenItemWrapper>
  );
};

const TokenItemComp = ({
  token,
  historyProtocol,
  poolId,
  historyTokenPrice,
  supportHistory,
  historyToken,
  positionIndex,
  isLoadingProtocolHistory,
}: {
  token: TokenItem;
  historyProtocol?: DisplayProtocol;
  poolId: string;
  historyTokenPrice?: { id: string; chain: string; price: number };
  historyToken?: TokenItem;
  supportHistory: boolean;
  positionIndex: string;
  isLoadingProtocolHistory: boolean;
}) => {
  const tokenHistory = useMemo(() => {
    const historyPortfolio = historyProtocol?.portfolio_item_list.find(
      (item) => item.pool.id === poolId && item.position_index === positionIndex
    );
    if (!supportHistory) {
      return null;
    }
    if (historyPortfolio) {
      const h = historyPortfolio.asset_token_list.find(
        (item) => item.chain === token.chain && item.id === token.id
      );
      if (h) {
        return h;
      }
    }
    if (historyTokenPrice) {
      return {
        ...token,
        price: historyTokenPrice.price,
        amount: 0,
      };
    }
    if (historyToken) {
      return historyToken;
    }
    return null;
  }, [
    poolId,
    historyProtocol,
    historyTokenPrice,
    token,
    supportHistory,
    historyToken,
    positionIndex,
  ]);

  const isDebt = useMemo(() => {
    return token.amount < 0;
  }, [token]);

  const amountChange = useMemo(() => {
    if (!tokenHistory) return 0;
    if (isDebt) {
      return -(token.amount - tokenHistory.amount);
    }
    return token.amount - tokenHistory.amount;
  }, [token, tokenHistory, isDebt]);

  const usdValue = useMemo(() => {
    return token.amount * token.price;
  }, [token]);

  const usdValueChange = useMemo(() => {
    if (!tokenHistory) {
      return {
        value: 0,
        percentage: 0,
      };
    }
    let historyAmount = tokenHistory.amount;
    if (!supportHistory) {
      historyAmount = token.amount;
    }
    const historyValue = historyAmount * tokenHistory.price;
    let valueChange = 0;
    valueChange =
      token.amount * token.price - historyAmount * tokenHistory.price;
    if (isDebt) {
      valueChange = -valueChange;
    }
    let percentage = valueChange === 0 ? 0 : valueChange / historyValue;
    if (historyValue === 0 && valueChange !== 0) {
      percentage = 1;
    }
    return {
      value: valueChange,
      percentage,
    };
  }, [tokenHistory, token, supportHistory, isDebt]);

  return (
    <TokenItemWrapper>
      <div className="token-symbol">
        <TokenWithChain
          token={token}
          hideChainIcon
          width="18px"
          height="18px"
        />
        <div className="symbol">{ellipsisTokenSymbol(token.symbol)}</div>
        {isDebt && <div className="debt-tag">Debt</div>}
      </div>
      <div className="token-price">${formatPrice(token.price)}</div>
      <div className="token-amount">
        {`${formatAmount(token.amount)}`} {ellipsisTokenSymbol(token.symbol)}
        {!isLoadingProtocolHistory &&
          supportHistory &&
          tokenHistory &&
          Math.abs(amountChange * token.price) >= 0.01 && (
            <div
              className={classNames('price-change', {
                'is-loss': !isDebt && amountChange < 0,
                'is-increase': !isDebt && amountChange > 0,
              })}
            >
              {amountChange >= 0 ? '+' : '-'}
              {`${formatAmount(Math.abs(amountChange))}`}{' '}
              <span className="symbol">
                {ellipsisTokenSymbol(token.symbol)}
              </span>
              {` (${formatUsdValue(Math.abs(amountChange * token.price))})`}
            </div>
          )}
      </div>
      <div className="token-usd-value">
        {`${formatUsdValue(usdValue || '0')}`}
        {!isLoadingProtocolHistory && supportHistory && tokenHistory && (
          <div
            className={classNames('price-change', {
              'is-loss': !isDebt && usdValueChange.value < 0,
              'is-increase': !isDebt && usdValueChange.value > 0,
            })}
          >
            {usdValueChange.value >= 0 ? '+' : '-'}
            {`${(Math.abs(usdValueChange.percentage) * 100).toFixed(
              2
            )}% (${formatUsdValue(Math.abs(usdValueChange.value))})`}
          </div>
        )}
      </div>
    </TokenItemWrapper>
  );
};

const PoolItem = ({
  portfolio,
  historyProtocol,
  protocolHistoryTokenPriceMap,
  supportHistory,
  historyTokenDict,
  isLoadingProtocolHistory,
}: {
  portfolio: PortfolioItem;
  historyProtocol?: DisplayProtocol;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; chain: string; price: number }
  >;
  supportHistory: boolean;
  isLoadingProtocolHistory: boolean;
  historyTokenDict: Record<string, TokenItem>;
}) => {
  return (
    <PoolItemWrapper>
      <div className="tag">{portfolio.name}</div>
      {portfolio.asset_token_list?.map((token, index) => (
        <TokenItemComp
          // eslint-disable-next-line react/no-array-index-key
          key={`${token.chain}-${token.id}-${index}`}
          poolId={portfolio.pool.id}
          token={token}
          historyProtocol={historyProtocol}
          historyTokenPrice={
            protocolHistoryTokenPriceMap[`${token.chain}-${token.id}`]
          }
          supportHistory={supportHistory}
          historyToken={historyTokenDict[`${token.chain}-${token.id}`]}
          positionIndex={portfolio.position_index}
          isLoadingProtocolHistory={isLoadingProtocolHistory}
        />
      ))}
    </PoolItemWrapper>
  );
};

export const LoadingPoolItem = () => {
  return (
    <PoolItemWrapper>
      <LoadingTokenItem />
      <LoadingTokenItem />
    </PoolItemWrapper>
  );
};

export default PoolItem;
