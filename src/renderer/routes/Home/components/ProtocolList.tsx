import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import ProtocolItem, { LoadingProtocolItem } from './ProtocolItem';

const ProtocolList = ({
  protocolList,
  historyProtocolMap,
  protocolHistoryTokenPriceMap,
  onRelateDapp,
  isLoading,
}: {
  protocolList: DisplayProtocol[];
  historyProtocolMap: Record<string, DisplayProtocol>;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; price: number; chain: string }
  >;
  onRelateDapp(protocol: DisplayProtocol): void;
  isLoading: boolean;
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
        />
      ))}
    </div>
  );
};

export default ProtocolList;
