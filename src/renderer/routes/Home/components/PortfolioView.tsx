import { useMemo, useState } from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { DisplayChainWithWhiteLogo } from '@/renderer/hooks/useCurrentBalance';
import AssociateDappModal from '@/renderer/components/AssociateDappModal';
import { formatNumber } from '@/renderer/utils/number';
import TokenItemComp from './TokenItem';
import ProtocolItem from './ProtocolItem';

const PortfolioWrapper = styled.div`
  background: rgba(255, 255, 255, 0.07);
  width: 100%;
  padding: 46px 27px;
  border-radius: 8px;
  position: relative;
  flex: 1;
  .icon-asset-arrow {
    position: absolute;
    top: -8px;
    width: 15px;
    left: 0;
  }
  .assets-list {
    margin: 0;
    padding: 0;
    list-style: none;
    margin-bottom: 50px;
    .th {
      display: flex;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      padding: 0 23px;
      & > div {
        text-align: right;
        &:nth-child(1) {
          text-align: left;
          color: rgba(255, 255, 255, 0.8);
          width: 17%;
        }
        &:nth-child(2) {
          width: 22%;
        }
        &:nth-child(3) {
          width: 38%;
        }
        &:nth-child(4) {
          width: 23%;
        }
      }
    }
  }
`;

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

const PortfolioView = ({
  tokenList,
  historyTokenMap,
  protocolList,
  historyProtocolMap,
  protocolHistoryTokenPriceMap,
  chainBalances,
  selectChainServerId,
  tokenHidden,
  protocolHidden,
}: {
  tokenList: TokenItem[];
  historyTokenMap: Record<string, TokenItem>;
  protocolList: DisplayProtocol[];
  historyProtocolMap: Record<string, DisplayProtocol>;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; price: number; chain: string }
  >;
  chainBalances: DisplayChainWithWhiteLogo[];
  selectChainServerId: string | null;
  tokenHidden: {
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    setIsExpand(v: boolean): void;
  };
  protocolHidden: {
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    setIsExpand(v: boolean): void;
  };
}) => {
  const [relateDappModalOpen, setRelateDappModalOpen] = useState(false);
  const [relateDappUrl, setRelateDappUrl] = useState('');
  const [relateDappId, setRelateDappId] = useState('');
  const assetArrowLeft = useMemo(() => {
    if (!selectChainServerId) return 65;
    const el: HTMLLIElement | null = document.querySelector(
      `#chain-icon-${selectChainServerId}`
    );
    if (!el) return 65;
    return el.offsetLeft + el.offsetWidth / 2 - 7;
  }, [chainBalances, selectChainServerId]);

  const handleClickExpandToken = () => {
    tokenHidden.setIsExpand(!tokenHidden.isExpand);
  };

  const handleRelateDapp = (protocol: DisplayProtocol) => {
    setRelateDappId(protocol.id);
    setRelateDappUrl(protocol.site_url);
    setRelateDappModalOpen(true);
  };

  return (
    <PortfolioWrapper>
      <img
        src="rabby-internal://assets/icons/home/asset-arrow.svg"
        className="icon-asset-arrow"
        style={{
          transform: `translateX(${assetArrowLeft}px)`,
        }}
      />
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
      <div className="protocols">
        {protocolList.map((protocol) => (
          <ProtocolItem
            key={protocol.id}
            protocol={protocol}
            historyProtocol={historyProtocolMap[protocol.id]}
            protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
            onClickRelate={handleRelateDapp}
          />
        ))}
      </div>
      <AssociateDappModal
        protocolId={relateDappId}
        open={relateDappModalOpen}
        url={relateDappUrl}
        onCancel={() => setRelateDappModalOpen(false)}
      />
    </PortfolioWrapper>
  );
};

export default PortfolioView;
