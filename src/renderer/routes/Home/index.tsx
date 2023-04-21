import { useEffect, useState, useMemo, useRef } from 'react';
import { Skeleton } from 'antd';
import { usePrevious } from 'react-use';
import styled from 'styled-components';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';
import { sortBy } from 'lodash';
import { ellipsis } from '@/renderer/utils/address';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { formatNumber } from '@/renderer/utils/number';
import { formatChain, DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { useTotalBalance } from '@/renderer/utils/balance';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import useHistoryProtocol from '@/renderer/hooks/useHistoryProtocol';
import { copyText } from '@/renderer/utils/clipboard';
import {
  useZPopupLayerOnMain,
  useZViewsVisibleChanged,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { HomeTab } from '@/renderer/components/HomeTab/HomeTab';
import {
  useExpandList,
  useExpandProtocolList,
  useFilterProtoList,
  useFilterTokenList,
  useSwitchView,
} from './hooks';
import ChainList from './components/ChainList';
import Curve, { CurveModal } from './components/Curve';
import PortfolioView from './components/PortfolioView';
import RightBar from './components/RightBar';
import Transactions from './components/Transactions';
import { VIEW_TYPE } from './type';
import { HomeUpdateButton } from './components/HomeUpdateButton';

import './index.less';

const HomeBody = styled.div`
  padding-left: 28px;
  padding-right: 28px;
  height: calc(100vh - 118px - var(--mainwin-mainroute-topoffset));
`;

const Container = styled.div`
  display: flex;
  height: 100%;
  max-width: 1738px;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 28px;
`;

const HomeWrapper = styled.div`
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 1375px;
  margin: 0 auto;
  flex: 1;
  .header {
    width: 100%;
    margin-bottom: 20px;
    .top {
      display: flex;
      .left {
        z-index: 2;
        margin-right: 40px;
      }
      .right {
        flex: 1;
        position: relative;
      }
    }
    .current-address {
      font-weight: 400;
      font-size: 14px;
      line-height: 17px;
      color: #e5e9ef;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      .icon {
        cursor: pointer;
        margin-left: 8px;
      }
    }
    .balance {
      font-weight: 500;
      font-size: 46px;
      line-height: 1;
      display: flex;
      align-items: flex-end;
      .balance-change {
        display: flex;
        font-weight: 500;
        font-size: 18px;
        line-height: 1;
        margin-left: 6px;
        color: #4aebbb;
        padding-bottom: 4px;
        cursor: pointer;
        &.is-loss {
          color: #ff6565;
        }
      }
    }
  }
`;

const SwitchViewWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  .switch-view {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 4px;
    display: flex;
    justify-content: space-between;
    .item {
      padding: 5px 10px;
      font-size: 12px;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      border-radius: 4px;
      &.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.06);
      }
    }
  }
`;

const Home = () => {
  const rerenderAtRef = useRef(0);
  const [curveModalOpen, setCurveModalOpen] = useState(false);
  const { currentAccount } = useCurrentAccount();
  const prevAccount = usePrevious(currentAccount);
  const [updateNonce, setUpdateNonce] = useState(0);
  const [selectChainServerId, setSelectChainServerId] = useState<string | null>(
    null
  );
  const [usedChainList, setUsedChainList] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);
  const { currentView, switchView } = useSwitchView();
  const {
    tokenList,
    historyTokenMap,
    isLoading: isLoadingTokenList,
    isLoadingRealTime: isLoadingRealTimeTokenList,
  } = useHistoryTokenList(currentAccount?.address, updateNonce, currentView);

  const filterTokenList = useFilterTokenList(tokenList, selectChainServerId);

  const {
    protocolList,
    historyProtocolMap,
    tokenHistoryPriceMap,
    isLoading: isLoadingProtocol,
    isLoadingHistory: isLoadingProtocolHistory,
    isLoadingRealTime: isLoadingRealTimeProtocol,
    supportHistoryChains,
    historyTokenDict,
  } = useHistoryProtocol(currentAccount?.address, updateNonce, currentView);
  const {
    filterList: displayTokenList,
    isShowExpand: isShowTokenExpand,
    isExpand: isTokenExpand,
    totalHidden: tokenHiddenUsdValue,
    totalHiddenCount: tokenHiddenCount,
    setIsExpand: setIsTokenExpand,
    usdValueChange: expandTokensUsdValueChange,
  } = useExpandList(
    filterTokenList,
    currentView === VIEW_TYPE.DEFAULT ? null : historyTokenMap,
    supportHistoryChains
  );
  const displayChainList = useMemo(() => {
    const map: Record<string, number> = {};
    protocolList.forEach((protocol) => {
      if (map[protocol.chain]) {
        map[protocol.chain] += protocol.usd_value;
      } else {
        map[protocol.chain] = protocol.usd_value;
      }
    });
    tokenList.forEach((token) => {
      if (map[token.chain]) {
        map[token.chain] += token.usd_value || 0;
      } else {
        map[token.chain] = token.usd_value || 0;
      }
    });
    const list = usedChainList.map((chain) => ({
      ...chain,
      usd_value: map[chain.id] || 0,
    }));
    return sortBy(list, (item) => item.usd_value).reverse();
  }, [usedChainList, protocolList, tokenList]);
  const totalBalance = useTotalBalance(tokenList, protocolList);

  const curveData = useCurve(currentAccount?.address, updateNonce);
  const location = useLocation();

  const filterProtocolList = useFilterProtoList(
    protocolList,
    selectChainServerId
  );
  const {
    filterList: displayProtocolList,
    isShowExpand: isShowProtocolExpand,
    isExpand: isProtocolExpand,
    totalHidden: protocolHiddenUsdValue,
    totalHiddenCount: protocolHiddenCount,
    setIsExpand: setIsProtocolExpand,
  } = useExpandProtocolList(filterProtocolList);

  const init = async () => {
    if (!currentAccount?.address) return;
    rerenderAtRef.current = Date.now();
    setIsProtocolExpand(false);
    setIsTokenExpand(false);
    switchView(VIEW_TYPE.DEFAULT);
    const chainList = await walletOpenapi.usedChainList(currentAccount.address);
    setUsedChainList(chainList.map((chain) => formatChain(chain)));
  };

  const handleClickRefresh = () => {
    setUpdateNonce(updateNonce + 1);
  };

  useEffect(() => {
    if (currentAccount && currentAccount?.address !== prevAccount?.address) {
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useZViewsVisibleChanged((visibles) => {
    if (
      Date.now() - rerenderAtRef.current >= 3600000 &&
      location.pathname === '/mainwin/home' &&
      !Object.values(visibles).some((item) => item) // all closed
    ) {
      init();
      setUpdateNonce(updateNonce + 1);
    }
  });

  useEffect(() => {
    if (location.pathname === '/mainwin/home') {
      if (Date.now() - rerenderAtRef.current >= 3600000) {
        init();
        setUpdateNonce(updateNonce + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const { showZSubview } = useZPopupLayerOnMain();

  return (
    <HomeBody>
      <HomeTab />
      <Container>
        <HomeWrapper>
          <div className="header">
            <div className="top">
              <div className="left">
                {isLoadingTokenList ? (
                  <div className="current-address">
                    <Skeleton.Input
                      active
                      style={{
                        width: '120px',
                        height: '17px',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                ) : (
                  <div className="current-address">
                    <span className="inline-flex items-center">
                      {ellipsis(currentAccount?.address || '')}
                      <TipsWrapper hoverTips="Copy" clickTips="Copied">
                        <img
                          onClick={async () => {
                            if (!currentAccount?.address) return;

                            await copyText(currentAccount.address);
                          }}
                          className="icon"
                          src="rabby-internal://assets/icons/home/copy.svg"
                        />
                      </TipsWrapper>
                    </span>

                    <span
                      className="inline-flex items-center"
                      onClick={() => {
                        showZSubview('address-detail', {
                          account:
                            currentAccount as IDisplayedAccountWithBalance,
                        });
                      }}
                    >
                      <TipsWrapper hoverTips="Address Detail">
                        <img
                          className="icon"
                          src="rabby-internal://assets/icons/home/info.svg"
                        />
                      </TipsWrapper>
                    </span>
                  </div>
                )}
                <div className="balance">
                  {isLoadingTokenList || !curveData ? (
                    <Skeleton.Input
                      active
                      style={{
                        width: '234px',
                        height: '46px',
                        borderRadius: '2px',
                      }}
                    />
                  ) : (
                    <>
                      ${formatNumber(totalBalance || 0)}{' '}
                      <div
                        className={classNames('balance-change', {
                          'is-loss': curveData.isLoss,
                        })}
                      >{`${curveData.isLoss ? '-' : '+'}${
                        curveData.changePercent
                      } (${curveData.change})`}</div>
                    </>
                  )}
                </div>
              </div>

              {curveData ? (
                <div className="right" onClick={() => setCurveModalOpen(true)}>
                  <div className="absolute right-0 bottom-0 z-10">
                    <HomeUpdateButton
                      loading={
                        isLoadingRealTimeTokenList || isLoadingRealTimeProtocol
                      }
                      onUpdate={handleClickRefresh}
                    />
                  </div>
                  {curveData.list.length > 0 && <Curve data={curveData} />}
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative flex-1 h-0">
            <Transactions updateNonce={updateNonce} />
            <div className="flex-1 h-full static-width-wrapper disable-mouseevents-on-ant-modal-open">
              <div>
                {isLoadingTokenList ? (
                  <Skeleton.Input
                    active
                    className="w-full h-[88px] rounded-[2px]"
                  />
                ) : (
                  <ChainList
                    chainBalances={displayChainList}
                    onChange={setSelectChainServerId}
                  />
                )}
                <SwitchViewWrapper className="my-[12px]">
                  <div className="switch-view">
                    <div
                      className={classNames('item', {
                        active: currentView === VIEW_TYPE.DEFAULT,
                      })}
                      onClick={() => switchView(VIEW_TYPE.DEFAULT)}
                    >
                      Default
                    </div>
                    <div
                      className={classNames('item', {
                        active: currentView === VIEW_TYPE.CHANGE,
                      })}
                      onClick={() => switchView(VIEW_TYPE.CHANGE)}
                    >
                      Change
                    </div>
                  </div>
                </SwitchViewWrapper>
              </div>
              <PortfolioView
                tokenList={displayTokenList}
                historyTokenMap={historyTokenMap}
                protocolList={displayProtocolList}
                historyProtocolMap={historyProtocolMap}
                protocolHistoryTokenPriceMap={tokenHistoryPriceMap}
                selectChainServerId={selectChainServerId}
                tokenHidden={{
                  isExpand: isTokenExpand,
                  hiddenCount: tokenHiddenCount,
                  hiddenUsdValue: tokenHiddenUsdValue,
                  expandTokensUsdValueChange,
                  setIsExpand: setIsTokenExpand,
                  isShowExpand: isShowTokenExpand,
                }}
                protocolHidden={{
                  isShowExpand: isShowProtocolExpand,
                  isExpand: isProtocolExpand,
                  hiddenCount: protocolHiddenCount,
                  hiddenUsdValue: protocolHiddenUsdValue,
                  setIsExpand: setIsProtocolExpand,
                }}
                isLoadingTokenList={isLoadingTokenList}
                isLoadingProtocolList={isLoadingProtocol}
                isLoadingProtocolHistory={isLoadingProtocolHistory}
                supportHistoryChains={supportHistoryChains}
                historyTokenDict={historyTokenDict}
                chainList={displayChainList}
                view={currentView}
              />
            </div>
          </div>
        </HomeWrapper>
        <RightBar updateNonce={updateNonce} />
      </Container>
      {curveModalOpen && (
        <CurveModal
          data={curveData}
          onClose={() => {
            setCurveModalOpen(false);
          }}
        />
      )}
    </HomeBody>
  );
};

export default Home;
