import styled from 'styled-components';
import classNames from 'classnames';
import { Skeleton } from 'antd';
import { ServerChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { formatNumber, formatUsdValue } from '@/renderer/utils/number';
import TokenItemComp, { LoadingTokenItem } from './TokenItem';
import { BlockedButton } from './TokenButton/BlockedButton';
import { CustomizedButton } from './TokenButton/CustomizedButton';

const ExpandItem = styled.div`
  display: flex;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #babec5;
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
    width: 14px;
    height: 5px;
    transform: rotate(90deg);
    transition: transform 0.3s;
  }
`;

const TokenList = ({
  tokenList,
  tokenHidden,
  historyTokenMap,
  isLoadingTokenList,
  supportHistoryChains,
  showHistory,
  onOpenLowAssets,
  onFocusInput,
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
    tokenHiddenList: TokenItem[];
    setIsExpand(v: boolean): void;
  };
  showHistory: boolean;
  onOpenLowAssets(): void;
  onFocusInput(): void;
}) => {
  const handleClickExpandToken = () => {
    // tokenHidden.setIsExpand(!tokenHidden.isExpand);
    onOpenLowAssets();
  };

  return (
    <ul className="assets-list">
      {isLoadingTokenList ? (
        <>
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
        </>
      ) : (
        <>
          <li className="th">
            <div>Asset</div>
            <div>Price</div>
            <div>Amount</div>
            <div>USD Value</div>
          </li>
          {tokenList.map((token) => (
            <TokenItemComp
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
                : `${tokenHidden.hiddenCount} low value assets`}
              <img
                src="rabby-internal://assets/icons/home/expand-arrow.svg"
                className={classNames('icon-expand-arrow')}
              />
              <div className="hide-assets-usd-value">
                {formatUsdValue(tokenHidden.hiddenUsdValue)}
                {showHistory && (
                  <div
                    className={classNames(
                      'usd-value-change absolute -bottom-12 right-0',
                      {
                        'is-loss': tokenHidden.expandTokensUsdValueChange < 0,
                        'is-increase':
                          tokenHidden.expandTokensUsdValueChange > 0,
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
        </>
      )}
      <div className="flex gap-12 mt-[24px] ml-[14px]">
        <CustomizedButton onClickLink={onFocusInput} />
        <BlockedButton onClickLink={onFocusInput} />
      </div>
    </ul>
  );
};

export default TokenList;
