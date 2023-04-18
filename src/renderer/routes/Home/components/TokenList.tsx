import styled from 'styled-components';
import classNames from 'classnames';
import { Skeleton } from 'antd';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { formatNumber, formatUsdValue } from '@/renderer/utils/number';
import { ReceiveModal } from '@/renderer/components/ReceiveModal';
import { useCallback, useState } from 'react';
import { getChain } from '@/renderer/utils';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';
import TokenItemComp, { LoadingTokenItem } from './TokenItem';
import { TokenActionModal } from './TokenActionModal';

const ExpandItem = styled.div`
  display: flex;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #9094a1;
  padding: 0 14px;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
  .icon-hide-assets {
    margin-right: 18px;
  }
  .hide-assets-usd-value {
    position: relative;
    font-weight: 700;
    font-size: 15px;
    line-height: 18px;
    text-align: right;
    flex: 1;
    color: #ffffff;
    .usd-value-change {
      font-size: 10px;
      line-height: 12px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: normal;
      &.is-loss {
        color: #ff6565;
      }
      &.is-increase {
        color: #4aebbb;
      }
    }
  }
  .icon-expand-arrow {
    width: 10px;
    height: 5px;
    transform: rotate(0);
    transition: transform 0.3s;
    margin-left: 13px;
    opacity: 0;
    &.flip {
      transform: rotate(180deg);
    }
  }
  &:hover {
    .icon-expand-arrow {
      opacity: 1;
    }
  }
`;

const TokenList = ({
  tokenList,
  tokenHidden,
  historyTokenMap,
  isLoadingTokenList,
  supportHistoryChains,
  showHistory,
}: {
  tokenList: TokenItem[];
  historyTokenMap: Record<string, TokenItem>;
  isLoadingTokenList: boolean;
  supportHistoryChains: ServerChain[];
  tokenHidden: {
    isShowExpand: boolean;
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    expandTokensUsdValueChange: number;
    setIsExpand(v: boolean): void;
  };
  showHistory: boolean;
}) => {
  const location = useLocation();
  const isBundlePage = location.pathname === '/mainwin/home/bundle';

  const [selectedToken, setSelectedToken] = useState<TokenItem>();

  const handleClickToken = useCallback((t: TokenItem) => {
    if (!t || !getChain(t?.chain)) {
      return;
    }
    setSelectedToken(t);
  }, []);

  const cancelTokenActionModal = () => {
    setSelectedToken(undefined);
  };

  const handleClickExpandToken = () => {
    tokenHidden.setIsExpand(!tokenHidden.isExpand);
  };

  const [state, setState] = useState<{
    isShowReceiveModal: boolean;
    token?: string;
    chain?: CHAINS_ENUM;
  }>({
    isShowReceiveModal: false,
    token: undefined,
    chain: undefined,
  });

  const handleReceiveClick = useCallback((token: TokenItem) => {
    setState({
      isShowReceiveModal: true,
      token: token.symbol,
      chain: getChain(token.chain)?.enum,
    });
  }, []);

  if (isLoadingTokenList) {
    return (
      <ul className="assets-list">
        <li className="th">
          <div>
            <Skeleton.Input
              active
              style={{
                width: '60px',
                height: '11px',
                borderRadius: '2px',
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '60px',
                height: '11px',
                borderRadius: '2px',
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '60px',
                height: '11px',
                borderRadius: '2px',
              }}
            />
          </div>
          <div>
            <Skeleton.Input
              active
              style={{
                width: '60px',
                height: '11px',
                borderRadius: '2px',
              }}
            />
          </div>
        </li>
        <LoadingTokenItem />
        <LoadingTokenItem />
        <LoadingTokenItem />
      </ul>
    );
  }

  return (
    <>
      <ul className="assets-list">
        <li className="th">
          <div>Asset</div>
          <div>Price</div>
          <div>Amount</div>
          <div>USD Value</div>
        </li>
        {tokenList.map((token) => (
          <TokenItemComp
            className={clsx(!isBundlePage && 'cursor-pointer')}
            onTokenClick={isBundlePage ? undefined : handleClickToken}
            token={token}
            historyToken={
              showHistory
                ? historyTokenMap[`${token.chain}-${token.id}`]
                : undefined
            }
            key={`${token.chain}-${token.id}`}
            supportHistory={
              !!supportHistoryChains.find((item) => item.id === token.chain)
            }
          />
        ))}
        {tokenHidden.hiddenCount > 0 && tokenHidden.isShowExpand && (
          <ExpandItem onClick={handleClickExpandToken}>
            <img
              className="icon-hide-assets"
              src="rabby-internal://assets/icons/home/hide-assets.svg"
            />
            {tokenHidden.isExpand
              ? 'Hide small value assets'
              : `${tokenHidden.hiddenCount} Assets are hidden`}
            <img
              src="rabby-internal://assets/icons/home/expand-arrow.svg"
              className={classNames('icon-expand-arrow', {
                flip: !tokenHidden.isExpand,
              })}
            />
            <div className="hide-assets-usd-value">
              {formatUsdValue(tokenHidden.hiddenUsdValue)}
              {showHistory && (
                <div
                  className={classNames(
                    'usd-value-change absolute -bottom-12 right-0',
                    {
                      'is-loss': tokenHidden.expandTokensUsdValueChange < 0,
                      'is-increase': tokenHidden.expandTokensUsdValueChange > 0,
                    }
                  )}
                >
                  {`${formatNumber(
                    (tokenHidden.expandTokensUsdValueChange /
                      tokenHidden.hiddenUsdValue) *
                      100
                  )}% (${formatUsdValue(
                    tokenHidden.expandTokensUsdValueChange
                  )})`}
                </div>
              )}
            </div>
          </ExpandItem>
        )}
      </ul>
      <ReceiveModal
        open={state.isShowReceiveModal}
        token={state.token}
        chain={state.chain}
        onCancel={() => {
          setState({
            isShowReceiveModal: false,
            token: undefined,
            chain: undefined,
          });
        }}
      />
      <TokenActionModal
        open={!!selectedToken}
        token={selectedToken}
        onCancel={cancelTokenActionModal}
        handleReceiveClick={handleReceiveClick}
      />
    </>
  );
};

export default TokenList;
