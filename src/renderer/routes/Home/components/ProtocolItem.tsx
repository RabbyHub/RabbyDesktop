import styled from 'styled-components';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import PoolItem from './PoolItem';

const ProtocolItemWrapper = styled.div`
  margin-bottom: 27px;
  .protocol-info {
    display: flex;
    padding-left: 25px;
    margin-bottom: 10px;
    align-items: center;
    .protocol-name {
      margin-left: 8px;
      font-weight: 700;
      font-size: 12px;
      line-height: 14px;
      color: #a9adb9;
      opacity: 0.6;
    }
    .token-with-chain {
      opacity: 0.6;
      .chain-logo {
        width: 8px;
        height: 8px;
        top: -4px;
        right: -4px;
      }
    }
  }
  .protocol-list {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }
`;

const ProtocolItem = ({
  protocol,
  historyProtocol,
  protocolHistoryTokenPriceMap,
}: {
  protocol: DisplayProtocol;
  historyProtocol?: DisplayProtocol;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; chain: string; price: number }
  >;
}) => {
  return (
    <ProtocolItemWrapper>
      <div className="protocol-info">
        <IconWithChain
          iconUrl={protocol.logo_url}
          chainServerId={protocol.chain}
          width="14px"
          height="14px"
          noRound
        />
        <span className="protocol-name">{protocol.name}</span>
      </div>
      <div className="protocol-list">
        {protocol.portfolio_item_list.map((portfolio) => (
          <PoolItem
            portfolio={portfolio}
            historyProtocol={historyProtocol}
            protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
            key={`${portfolio.position_index}-${portfolio.pool.id}`}
          />
        ))}
      </div>
    </ProtocolItemWrapper>
  );
};

export default ProtocolItem;
