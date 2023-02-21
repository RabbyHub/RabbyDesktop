import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { VIEW_TYPE } from '../hooks';
import HistoryProtocolItem, {
  LoadingProtocolItem,
} from './HistoryProtocolItem';
import ProtocolItem from './DefaultProtocolItem';

const ProtocolList = ({
  protocolList,
  historyProtocolMap,
  protocolHistoryTokenPriceMap,
  onRelateDapp,
  isLoading,
  isLoadingProtocolHistory,
  supportHistoryChains,
  historyTokenDict,
  view,
}: {
  protocolList: DisplayProtocol[];
  historyProtocolMap: Record<string, DisplayProtocol>;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; price: number; chain: string }
  >;
  onRelateDapp(protocol: DisplayProtocol): void;
  isLoading: boolean;
  isLoadingProtocolHistory: boolean;
  supportHistoryChains: ServerChain[];
  historyTokenDict: Record<string, TokenItem>;
  view: VIEW_TYPE;
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
      {view === VIEW_TYPE.CHANGE &&
        protocolList.map((protocol) => (
          <HistoryProtocolItem
            key={protocol.id}
            protocol={protocol}
            historyProtocol={historyProtocolMap[protocol.id]}
            protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
            onClickRelate={onRelateDapp}
            supportHistory={supportHistoryChains.some(
              (item) => item.id === protocol.chain
            )}
            historyTokenDict={historyTokenDict}
            isLoadingProtocolHistory={isLoadingProtocolHistory}
          />
        ))}
      {view === VIEW_TYPE.DEFAULT &&
        protocolList.map((protocol) => (
          <ProtocolItem
            key={protocol.id}
            protocol={protocol}
            onClickRelate={onRelateDapp}
          />
        ))}
    </div>
  );
};

export default ProtocolList;
