import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { ServerChain, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import {
  DisplayChainWithWhiteLogo,
  DisplayUsedChain,
} from '@/isomorphic/wallet/chain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import AssociateDappModal from '@/renderer/components/AssociateDappModal';
import { checkIsCexChain } from '@/renderer/hooks/useBundle/cex/utils/shared';
import { useTokenAtom } from '@/renderer/hooks/rabbyx/useToken';
import TokenList from './TokenList';
import ProtocolList from './ProtocolList';
import ScrollTopContext from './scrollTopContext';
import { VIEW_TYPE } from '../type';
import { TokenActionModal } from '../../../components/TokenActionModal/TokenActionModal';
import { Summary } from './Summary';
import { LowAssetsModal } from './LowAssetsModal';

const PortfolioWrapper = styled.div`
  background: rgba(255, 255, 255, 0.03);
  width: 100%;
  padding: 0 14px 28px;
  padding-right: 0;
  border-radius: 8px;
  position: relative;
  .scroll-container {
    padding-right: 14px;
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
      line-height: 1;
      padding: 0 14px;
      margin-bottom: 15px;
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
  onFocusInput,
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
    tokenHiddenList: TokenItem[];
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
  chainList: (DisplayChainWithWhiteLogo | DisplayUsedChain)[];
  onFocusInput(): void;
}) => {
  const [relateDappModalOpen, setRelateDappModalOpen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [relateDappProtocol, setRelateDappProtocol] =
    useState<DisplayProtocol | null>(null);
  const { blocked, customize } = useTokenAtom();
  const isEmpty = useMemo(() => {
    return (
      !isLoadingProtocolList &&
      !isLoadingTokenList &&
      tokenList.length <= 0 &&
      protocolList.length <= 0 &&
      blocked.length <= 0 &&
      customize.length <= 0
    );
  }, [
    isLoadingProtocolList,
    isLoadingTokenList,
    tokenList.length,
    protocolList.length,
    blocked.length,
    customize.length,
  ]);
  const [visibleLowAssets, setVisibleLowAssets] = useState(false);

  const handleRelateDapp = (protocol: DisplayProtocol) => {
    setRelateDappProtocol(protocol);
    setRelateDappModalOpen(true);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const scroll = (e.target as HTMLDivElement).scrollTop;
    setScrollTop(scroll);
  };

  const isCexChain = useMemo(() => {
    return checkIsCexChain(selectChainServerId);
  }, [selectChainServerId]);

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
    <ScrollTopContext.Provider value={scrollTop}>
      <PortfolioWrapper>
        <div className="scroll-container" onScroll={handleScroll}>
          {view === VIEW_TYPE.SUMMARY || isCexChain ? null : (
            <>
              <TokenList
                tokenList={tokenList}
                historyTokenMap={historyTokenMap}
                tokenHidden={tokenHidden}
                isLoadingTokenList={isLoadingTokenList}
                supportHistoryChains={supportHistoryChains}
                showHistory={view === VIEW_TYPE.CHANGE}
                onOpenLowAssets={() => {
                  setVisibleLowAssets(true);
                }}
                onFocusInput={onFocusInput}
              />
            </>
          )}
          {view === VIEW_TYPE.SUMMARY ? (
            <Summary />
          ) : (
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
          )}
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

      <TokenActionModal />
      <LowAssetsModal
        list={tokenHidden.tokenHiddenList ?? []}
        visible={visibleLowAssets}
        onClose={() => {
          setVisibleLowAssets(false);
        }}
      />
    </ScrollTopContext.Provider>
  );
};

export default PortfolioView;
