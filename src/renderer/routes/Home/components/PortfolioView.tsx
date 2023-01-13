import { useMemo } from 'react';
import styled from 'styled-components';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { DisplayChainWithWhiteLogo } from '@/renderer/hooks/useCurrentBalance';
import TokenItemComp from './TokenItem';
import ProtocolItem from './ProtocolItem';

const PortfolioWrapper = styled.div`
  background: rgba(255, 255, 255, 0.07);
  width: 100%;
  padding: 46px 27px;
  border-radius: 8px;
  max-width: 1375px;
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
          width: 20%;
        }
        &:nth-child(2) {
          width: 20%;
        }
        &:nth-child(3) {
          width: 35%;
        }
        &:nth-child(4) {
          width: 25%;
        }
      }
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
}) => {
  const assetArrowLeft = useMemo(() => {
    if (!selectChainServerId) return 65;
    const el: HTMLLIElement | null = document.querySelector(
      `#chain-icon-${selectChainServerId}`
    );
    if (!el) return 65;
    return el.offsetLeft + el.offsetWidth / 2 - 7;
  }, [chainBalances, selectChainServerId]);

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
      </ul>
      <div className="protocols">
        {protocolList.map((protocol) => (
          <ProtocolItem
            key={protocol.id}
            protocol={protocol}
            historyProtocol={historyProtocolMap[protocol.id]}
            protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
          />
        ))}
      </div>
    </PortfolioWrapper>
  );
};

export default PortfolioView;
