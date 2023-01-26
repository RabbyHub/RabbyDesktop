import styled from 'styled-components';
import classNames from 'classnames';
import { Skeleton } from 'antd';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { formatNumber } from '@/renderer/utils/number';
import TokenItemComp, { LoadingTokenItem } from './TokenItem';

const ExpandItem = styled.div`
  display: flex;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #9094a1;
  padding: 0 23px;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
  .icon-hide-assets {
    margin-right: 18px;
  }
  .hide-assets-usd-value {
    font-weight: 700;
    font-size: 13px;
    line-height: 18px;
    text-align: right;
    flex: 1;
    color: #ffffff;
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
}: {
  tokenList: TokenItem[];
  historyTokenMap: Record<string, TokenItem>;
  isLoadingTokenList: boolean;
  tokenHidden: {
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    setIsExpand(v: boolean): void;
  };
}) => {
  const handleClickExpandToken = () => {
    tokenHidden.setIsExpand(!tokenHidden.isExpand);
  };

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
    <ul className="assets-list">
      <li className="th">
        <div>Asset</div>
        <div>Price</div>
        <div>Amount</div>
        <div>USD-Value</div>
      </li>
      {tokenList.map((token) => (
        <TokenItemComp
          token={token}
          historyToken={historyTokenMap[`${token.chain}-${token.id}`]}
          key={`${token.chain}-${token.id}`}
        />
      ))}
      {tokenHidden.hiddenCount > 0 && (
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
          <span className="hide-assets-usd-value">
            ${formatNumber(tokenHidden.hiddenUsdValue)}
          </span>
        </ExpandItem>
      )}
    </ul>
  );
};

export default TokenList;
