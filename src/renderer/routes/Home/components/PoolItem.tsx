import { useMemo } from 'react';
import styled from 'styled-components';
import { Skeleton } from 'antd';
import { PortfolioItem, TokenItem } from '@debank/rabby-api/dist/types';
import classNames from 'classnames';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { formatNumber } from '@/renderer/utils/number';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ellipsisTokenSymbol } from '@/renderer/utils/token';
import BigNumber from 'bignumber.js';

const PoolItemWrapper = styled.div`
  padding: 25px 25px 0 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  &:nth-last-child(1) {
    border-bottom: none;
  }
  &:hover {
    border-radius: 8px;
    border-color: transparent;
    background: linear-gradient(91.16deg, #5e626b 2.51%, #4d515f 95.88%);
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.07);
    .pool-item-footer {
      display: flex;
    }
    .number-change {
      opacity: 1;
    }
  }
`;

const PoolItemFooter = styled.div`
  position: relative;
  height: 46px;
  display: flex;
  align-items: center;
  font-weight: 510;
  font-size: 12px;
  line-height: 14px;
  color: #ffffff;
  display: none;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  .icon-pool {
    margin-right: 8px;
  }
  .pool-contract {
    margin-left: 4px;
    color: #b8b8b8;
  }
  .pool-usd-value {
    flex: 1;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 700;
    font-size: 13px;
    line-height: 16px;
    color: #ffffff;
  }
`;

const TokenItemWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 30px;
  margin-bottom: 15px;
  .token-symbol {
    display: flex;
    font-weight: 500;
    font-size: 13px;
    line-height: 16px;
    color: #ffffff;
    width: 17%;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
    .symbol {
      flex: 1;
      margin-left: 16px;
    }
  }
  .token-price {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    width: 22%;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    color: #ffffff;
  }
  .price-change {
    width: 100%;
    font-weight: 400;
    font-size: 10px;
    line-height: 12px;
    color: #2ed4a3;
    text-align: right;
    &.is-loss {
      color: #ff6060;
    }
  }
  .token-amount {
    width: 38%;
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
  }
  .token-usd-value {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    width: 23%;
    font-weight: 700;
    font-size: 12px;
    line-height: 14px;
    text-align: right;
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
}: {
  token: TokenItem;
  historyProtocol?: DisplayProtocol;
  poolId: string;
  historyTokenPrice?: { id: string; chain: string; price: number };
}) => {
  const tokenHistory = useMemo(() => {
    const historyPortfolio = historyProtocol?.portfolio_item_list.find(
      (item) => item.pool.id === poolId
    );
    if (!historyPortfolio) {
      return null;
    }
    const h = historyPortfolio.asset_token_list.find(
      (item) => item.chain === token.chain && item.id === token.id
    );
    if (h) return h;
    if (historyTokenPrice) {
      return {
        ...token,
        price: historyTokenPrice.price,
        amount: 0,
      };
    }
    return null;
  }, [poolId, historyProtocol, historyTokenPrice]);

  const priceChange = useMemo(() => {
    if (!tokenHistory) return 0;
    if (tokenHistory.price === 0) return token.price;
    return (token.price - tokenHistory.price) / tokenHistory.price;
  }, [token, tokenHistory]);

  const amountChange = useMemo(() => {
    if (!tokenHistory) return 0;
    return token.amount - tokenHistory.amount;
  }, [token, tokenHistory]);

  const usdValue = useMemo(() => {
    return token.amount * token.price;
  }, [token]);

  const usdValueChange = useMemo(() => {
    if (!tokenHistory) return 0;
    return usdValue - tokenHistory.price * tokenHistory.amount;
  }, [usdValue, tokenHistory]);

  return (
    <TokenItemWrapper>
      <div className="token-symbol">
        <TokenWithChain
          token={token}
          hideChainIcon
          width="18px"
          height="18px"
        />
        <div className="symbol">{token.symbol}</div>
      </div>
      <div className="token-price">
        {tokenHistory && (
          <div className="number-change">
            ${formatNumber(tokenHistory.price)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        ${formatNumber(token.price)}
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
      </div>
      <div className="token-amount">
        {tokenHistory && (
          <div className="number-change">
            {formatNumber(tokenHistory.amount, 4)}{' '}
            {ellipsisTokenSymbol(tokenHistory.symbol)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        {`${formatNumber(token.amount, 4)}`} {ellipsisTokenSymbol(token.symbol)}
        {amountChange !== 0 && (
          <div
            className={classNames('price-change', {
              'is-loss': amountChange < 0,
            })}
          >
            {amountChange > 0 ? '+' : '-'}
            {`${formatNumber(Math.abs(amountChange), 4)}`}{' '}
            <span className="symbol">{ellipsisTokenSymbol(token.symbol)}</span>
          </div>
        )}
      </div>
      <div className="token-usd-value">
        {tokenHistory && (
          <div className="number-change">
            ${formatNumber(tokenHistory.price * tokenHistory.amount || 0)}
            <img
              className="icon-numer-change-arrow"
              src="rabby-internal://assets/icons/home/amount-change-arrow.svg"
            />
          </div>
        )}
        {`$${formatNumber(usdValue || '0')}`}
        {usdValueChange !== 0 && (
          <div
            className={classNames('price-change', {
              'is-loss': usdValueChange < 0,
            })}
          >
            {usdValueChange > 0 ? '+' : '-'}$
            {formatNumber(Math.abs(usdValueChange))}
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
}: {
  portfolio: PortfolioItem;
  historyProtocol?: DisplayProtocol;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; chain: string; price: number }
  >;
}) => {
  const totalUsdValue = useMemo(() => {
    return (portfolio.asset_token_list || []).reduce((sum, item) => {
      return sum.plus(new BigNumber(item.amount).times(item.price));
    }, new BigNumber(0));
  }, [portfolio]);

  return (
    <PoolItemWrapper>
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
        />
      ))}
      <PoolItemFooter className="pool-item-footer">
        <img
          className="icon-pool"
          src="rabby-internal://assets/icons/home/pool.svg"
        />
        {portfolio.name}
        <span className="pool-contract">({portfolio.pool.controller})</span>
        <span className="pool-usd-value">
          ${formatNumber(totalUsdValue.toFixed())}
        </span>
      </PoolItemFooter>
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
