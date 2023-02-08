import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import AssociateDappModal from '@/renderer/components/AssociateDappModal';
import TokenList from './TokenList';
import ProtocolList from './ProtocolList';

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
        text-align: left;
        &:nth-child(1) {
          color: rgba(255, 255, 255, 0.8);
          width: 25%;
        }
        &:nth-child(2) {
          width: 25%;
        }
        &:nth-child(3) {
          width: 25%;
        }
        &:nth-child(4) {
          text-align: right;
          width: 25%;
        }
      }
    }
  }
  &.empty {
    display: flex;
    flex-direction: column;
    flex: auto;
    flex-grow: 0;
    height: 300px;
    align-items: center;
    justify-content: center;
    .icon-empty {
      width: 60px;
    }
    .text-empty {
      font-size: 18px;
      line-height: 21px;
      color: rgba(255, 255, 255, 0.4);
      margin: 0;
      margin-top: 20px;
    }
  }
`;

const PortfolioView = ({
  tokenList,
  historyTokenMap,
  protocolList,
  historyProtocolMap,
  protocolHistoryTokenPriceMap,
  selectChainServerId,
  tokenHidden,
  protocolHidden,
  isLoadingTokenList,
  isLoadingProtocolList,
  isLoadingProtocolHistory,
  supportHistoryChains,
  historyTokenDict,
}: {
  tokenList: TokenItem[];
  historyTokenMap: Record<string, TokenItem>;
  protocolList: DisplayProtocol[];
  historyProtocolMap: Record<string, DisplayProtocol>;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; price: number; chain: string }
  >;
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
  isLoadingTokenList: boolean;
  isLoadingProtocolList: boolean;
  isLoadingProtocolHistory: boolean;
  supportHistoryChains: ServerChain[];
  historyTokenDict: Record<string, TokenItem>;
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
  }, [selectChainServerId]);
  const isEmpty = useMemo(() => {
    return (
      !isLoadingProtocolList &&
      !isLoadingTokenList &&
      tokenList.length <= 0 &&
      protocolList.length <= 0
    );
  }, [isLoadingProtocolList, isLoadingTokenList, tokenList, protocolList]);

  const handleRelateDapp = (protocol: DisplayProtocol) => {
    setRelateDappId(protocol.id);
    setRelateDappUrl(protocol.site_url);
    setRelateDappModalOpen(true);
  };

  if (isEmpty) {
    return (
      <PortfolioWrapper className="empty">
        <img
          className="icon-empty"
          src="rabby-internal://assets/icons/home/asset-empty.svg"
        />
        <p className="text-empty">No assets</p>
      </PortfolioWrapper>
    );
  }

  return (
    <PortfolioWrapper>
      <img
        src="rabby-internal://assets/icons/home/asset-arrow.svg"
        className="icon-asset-arrow"
        style={{
          transform: `translateX(${assetArrowLeft}px)`,
        }}
      />
      <TokenList
        tokenList={tokenList}
        historyTokenMap={historyTokenMap}
        tokenHidden={tokenHidden}
        isLoadingTokenList={isLoadingTokenList}
        supportHistoryChains={supportHistoryChains}
      />
      <ProtocolList
        protocolList={protocolList}
        historyProtocolMap={historyProtocolMap}
        protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
        onRelateDapp={handleRelateDapp}
        isLoading={isLoadingProtocolList}
        supportHistoryChains={supportHistoryChains}
        historyTokenDict={historyTokenDict}
        isLoadingProtocolHistory={isLoadingProtocolHistory}
      />
      <AssociateDappModal
        protocolId={relateDappId}
        open={relateDappModalOpen}
        url={relateDappUrl}
        onCancel={() => setRelateDappModalOpen(false)}
        onOk={() => setRelateDappModalOpen(false)}
      />
    </PortfolioWrapper>
  );
};

export default PortfolioView;
