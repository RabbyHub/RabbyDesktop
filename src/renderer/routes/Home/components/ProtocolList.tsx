import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import ProtocolItem, { LoadingProtocolItem } from './ProtocolItem';

const ProtocolList = ({
  protocolList,
  historyProtocolMap,
  protocolHistoryTokenPriceMap,
  onRelateDapp,
  isLoading,
  supportHistoryChains,
  historyTokenDict,
}: {
  protocolList: DisplayProtocol[];
  historyProtocolMap: Record<string, DisplayProtocol>;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; price: number; chain: string }
  >;
  onRelateDapp(protocol: DisplayProtocol): void;
  isLoading: boolean;
  supportHistoryChains: ServerChain[];
  historyTokenDict: Record<string, TokenItem>;
}) => {
  if (isLoading) {
    return (
      <div className="protocols">
        <LoadingProtocolItem />
        <LoadingProtocolItem />
        <LoadingProtocolItem />
      </div>
    );
  }
  return (
    <div className="protocols">
      {protocolList.map((protocol) => (
        <ProtocolItem
          key={protocol.id}
          protocol={protocol}
          historyProtocol={historyProtocolMap[protocol.id]}
          protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
          onClickRelate={onRelateDapp}
          supportHistory={supportHistoryChains.some(
            (item) => item.id === protocol.chain
          )}
          historyTokenDict={historyTokenDict}
        />
      ))}
    </div>
  );
};

export default ProtocolList;
