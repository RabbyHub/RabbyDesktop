import styled from 'styled-components';
import classNames from 'classnames';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { VIEW_TYPE } from '../type';
import HistoryProtocolItem, {
  LoadingProtocolItem,
} from './HistoryProtocolItem';
import ProtocolItem from './DefaultProtocolItem';

const Expand = styled.div`
  display: flex;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  justify-content: center;
  cursor: pointer;
  .show-all {
    color: rgba(255, 255, 255, 0.5);
    margin-left: 2px;
    display: flex;
    align-items: center;
    .icon-triangle {
      transform: rotate(0deg);
      transition: transform 0.3s;
      margin-left: 7px;
      &.flip {
        transform: rotate(180deg);
      }
    }
  }
`;

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
  protocolHidden,
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
  protocolHidden: {
    isShowExpand: boolean;
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    setIsExpand(v: boolean): void;
  };
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
      {protocolHidden.hiddenCount > 0 && protocolHidden.isShowExpand && (
        <Expand
          onClick={() => {
            protocolHidden.setIsExpand(!protocolHidden.isExpand);
          }}
        >
          {protocolHidden.isExpand
            ? 'Hide protocols with small deposits.'
            : 'Protocols with small deposits are not displayed.'}{' '}
          <div className="show-all">
            {!protocolHidden.isExpand && 'Show all'}
            <img
              className={classNames('icon-triangle', {
                flip: protocolHidden.isExpand,
              })}
              src="rabby-internal://assets/icons/home/triange.svg"
            />
          </div>
        </Expand>
      )}
    </div>
  );
};

export default ProtocolList;
