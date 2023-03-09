import { useMemo, useState } from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import AssociateDappModal from '@/renderer/components/AssociateDappModal';
import TokenList from './TokenList';
import ProtocolList from './ProtocolList';
import { VIEW_TYPE } from '../hooks';
import ScrollTopContext from './scrollTopContext';

const PortfolioWrapper = styled.div`
  background: rgba(255, 255, 255, 0.07);
  width: 100%;
  padding: 0 27px;
  padding-right: 0;
  border-radius: 8px;
  position: relative;
  height: 100%;
  .scroll-container {
    overflow: overlay;
    height: 100%;
    padding-right: 27px;
    padding-top: 28px;
    padding-bottom: 28px;
  }
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
      margin-bottom: 28px;
      & > div {
        text-align: left;
        &:nth-child(1) {
          color: rgba(255, 255, 255, 0.8);
          width: 30%;
        }
        &:nth-child(2) {
          width: 24%;
        }
        &:nth-child(3) {
          width: 29%;
        }
        &:nth-child(4) {
          text-align: right;
          width: 17%;
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
  view,
  chainList,
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
    isShowExpand: boolean;
    isExpand: boolean;
    hiddenCount: number;
    hiddenUsdValue: number;
    expandTokensUsdValueChange: number;
    setIsExpand(v: boolean): void;
  };
  protocolHidden: {
    isShowExpand: boolean;
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
  view: VIEW_TYPE;
  chainList: DisplayChainWithWhiteLogo[];
}) => {
  const [relateDappModalOpen, setRelateDappModalOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [relateDappProtocol, setRelateDappProtocol] =
    useState<DisplayProtocol | null>(null);
  const assetArrowLeft = useMemo(() => {
    const el: HTMLLIElement | null = document.querySelector(
      `#chain-icon-${selectChainServerId}`
    );
    if (!selectChainServerId) {
      return (24 * Math.min(27, chainList.length || 2)) / 2 - 7;
    }
    if (!el) return 65;
    return el.offsetLeft + el.offsetWidth / 2 - 7;
  }, [selectChainServerId, chainList]);
  const isEmpty = useMemo(() => {
    return (
      !isLoadingProtocolList &&
      !isLoadingTokenList &&
      tokenList.length <= 0 &&
      protocolList.length <= 0
    );
  }, [isLoadingProtocolList, isLoadingTokenList, tokenList, protocolList]);

  const handleRelateDapp = (protocol: DisplayProtocol) => {
    setRelateDappProtocol(protocol);
    setRelateDappModalOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const scroll = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(scroll);
  };

  if (isEmpty) {
    return (
      <div className="flex-1 overflow-hidden pt-[15px]">
        <PortfolioWrapper className="empty">
          <img
            src="rabby-internal://assets/icons/home/asset-arrow.svg"
            className="icon-asset-arrow"
            style={{
              transform: `translateX(${assetArrowLeft}px)`,
            }}
          />
          {chainList.length > 1 && (
            <img
              src="rabby-internal://assets/icons/home/asset-arrow.svg"
              className="icon-asset-arrow"
              style={{
                transform: `translateX(${assetArrowLeft}px)`,
              }}
            />
          )}
          <img
            className="icon-empty"
            src="rabby-internal://assets/icons/home/asset-empty.svg"
          />
          <p className="text-empty">No assets</p>
        </PortfolioWrapper>
      </div>
    );
  }

  return (
    <ScrollTopContext.Provider value={scrollTop}>
      <div className="flex-1 overflow-hidden pt-[15px]">
        <PortfolioWrapper>
          <img
            src="rabby-internal://assets/icons/home/asset-arrow.svg"
            className="icon-asset-arrow"
            style={{
              transform: `translateX(${assetArrowLeft}px)`,
            }}
          />
          <div className="scroll-container" onScroll={handleScroll}>
            <TokenList
              tokenList={tokenList}
              historyTokenMap={historyTokenMap}
              tokenHidden={tokenHidden}
              isLoadingTokenList={isLoadingTokenList}
              supportHistoryChains={supportHistoryChains}
              showHistory={view === VIEW_TYPE.CHANGE}
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
              view={view}
              protocolHidden={protocolHidden}
            />
            {relateDappProtocol && (
              <AssociateDappModal
                relateDappProtocol={relateDappProtocol}
                open={relateDappModalOpen}
                onCancel={() => setRelateDappModalOpen(false)}
                onOk={() => setRelateDappModalOpen(false)}
              />
            )}
          </div>
        </PortfolioWrapper>
      </div>
    </ScrollTopContext.Provider>
  );
};

export default PortfolioView;
