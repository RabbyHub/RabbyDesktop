import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Skeleton } from 'antd';
import { usePrevious } from 'react-use';
import styled from 'styled-components';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';
import { markEffectHookIsOnetime } from 'react-fiber-keep-alive';
import { sortBy, debounce } from 'lodash';
import { ellipsis } from '@/renderer/utils/address';
import { TipsWrapper } from '@/renderer/components/TipWrapper';
import { formatNumber } from '@/renderer/utils/number';
import { DisplayUsedChain, formatUsedChain } from '@/isomorphic/wallet/chain';
import { useTotalBalance } from '@/renderer/utils/balance';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import useHistoryProtocol from '@/renderer/hooks/useHistoryProtocol';
import { copyText } from '@/renderer/utils/clipboard';
import {
  useZPopupLayerOnMain,
  useZViewsVisibleChanged,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { HomeTab } from '@/renderer/components/HomeTab/HomeTab';
import NetSwitchTabs, {
  useSwitchNetTab,
} from '@/renderer/components/PillsSwitch/NetSwitchTabs';
import { requestOpenApiWithChainId } from '@/main/utils/openapi';
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
import { useFetchSummary } from './components/Summary/hook';
import { TokenSearchInput } from './components/TokenSearchInput';

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

const ToolbarWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

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
  const [usedChainList, setUsedChainList] = useState<DisplayUsedChain[]>([]);
  const { currentView, switchView } = useSwitchView();
  const [search, setSearch] = useState('');
  const { isShowTestnet, selectedTab, onTabChange } = useSwitchNetTab();
  const isTestnet = selectedTab === 'testnet';
  const prevIsTestnet = usePrevious(isTestnet);
  const {
    tokenList,
    historyTokenMap,
    isLoading: isLoadingTokenList,
    isLoadingRealTime: isLoadingRealTimeTokenList,
  } = useHistoryTokenList(
    currentAccount?.address,
    updateNonce,
    currentView,
    isTestnet
  );
  const { filterTokenList, isLoading: isSearchingTokenList } =
    useFilterTokenList(
      tokenList,
      selectChainServerId,
      currentAccount?.address,
      search,
      true
    );

  const {
    protocolList,
    historyProtocolMap,
    tokenHistoryPriceMap,
    isLoading: isLoadingProtocol,
    isLoadingHistory: isLoadingProtocolHistory,
    isLoadingRealTime: isLoadingRealTimeProtocol,
    supportHistoryChains,
    historyTokenDict,
  } = useHistoryProtocol(
    currentAccount?.address,
    updateNonce,
    currentView,
    isTestnet
  );

  useFetchSummary(currentAccount?.address, selectChainServerId, updateNonce);

  const {
    filterList: displayTokenList,
    isShowExpand: isShowTokenExpand,
    isExpand: isTokenExpand,
    totalHidden: tokenHiddenUsdValue,
    totalHiddenCount: tokenHiddenCount,
    setIsExpand: setIsTokenExpand,
    usdValueChange: expandTokensUsdValueChange,
    tokenHiddenList,
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
    const list = usedChainList
      .map((chain) => ({
        ...chain,
        usd_value: map[chain.id] || 0,
      }))
      .filter((item) => item.usd_value > 0);
    return sortBy(list, (item) => item.usd_value).reverse();
  }, [usedChainList, protocolList, tokenList]);
  const totalBalance = useTotalBalance(tokenList, protocolList);

  const curveDataRaw = useCurve(currentAccount?.address, updateNonce);
  const curveData = isTestnet ? undefined : curveDataRaw;
  const location = useLocation();

  const filterProtocolList = useFilterProtoList(
    protocolList,
    selectChainServerId,
    search
  );
  const {
    filterList: displayProtocolList,
    isShowExpand: isShowProtocolExpand,
    isExpand: isProtocolExpand,
    totalHidden: protocolHiddenUsdValue,
    totalHiddenCount: protocolHiddenCount,
    setIsExpand: setIsProtocolExpand,
  } = useExpandProtocolList(filterProtocolList);

  const init = async (_isTestnet: boolean) => {
    if (!currentAccount?.address) return;
    rerenderAtRef.current = Date.now();
    setIsProtocolExpand(false);
    setIsTokenExpand(false);
    switchView(VIEW_TYPE.DEFAULT);
    const chainList = await requestOpenApiWithChainId(
      ({ openapi }) => openapi.usedChainList(currentAccount.address),
      {
        isTestnet: _isTestnet,
      }
    );
    setUsedChainList(chainList.map((chain) => formatUsedChain(chain)));
    walletController.getAddressBalance(
      currentAccount?.address,
      false,
      _isTestnet
    );
  };

  const handleClickRefresh = () => {
    setUpdateNonce(updateNonce + 1);
  };

  // const keepAliveCacheRef = useRef<number>(0);
  // useEffect(markEffectHookIsOnetime(() => {
  //   keepAliveCacheRef.current += 1;
  // }), []);

  useEffect(markEffectHookIsOnetime(() => {
    if (currentAccount && currentAccount?.address !== prevAccount?.address) {
      init(isTestnet);
    } else if (isTestnet !== prevIsTestnet) {
      init(isTestnet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentAccount, isTestnet]);

  useZViewsVisibleChanged((visibles) => {
    if (
      Date.now() - rerenderAtRef.current >= 3600000 &&
      location.pathname === '/mainwin/home' &&
      !Object.values(visibles).some((item) => item) // all closed
    ) {
      init(isTestnet);
      setUpdateNonce(updateNonce + 1);
    }
  });

  useEffect(markEffectHookIsOnetime(() => {
    if (location.pathname === '/mainwin/home') {
      if (Date.now() - rerenderAtRef.current >= 3600000) {
        init(isTestnet);
        setUpdateNonce(updateNonce + 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [location]);

  useEffect(markEffectHookIsOnetime(() => {
    const updateFn = debounce(() => {
      setUpdateNonce((prev) => {
        return prev + 1;
      });
    }, 8000);
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (
          payload.event !== 'transactionChanged' ||
          payload.data?.type !== 'finished'
        )
          return;
        if (payload.data?.success) {
          updateFn();
        }
      }
    );
  }), []);

  const { showZSubview } = useZPopupLayerOnMain();
  const inputRef = useRef<HTMLInputElement>(null);
  const onFocusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(markEffectHookIsOnetime(() => {
    if (search) {
      switchView(VIEW_TYPE.DEFAULT);
    }
  }), [search, switchView]);

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

                    {isShowTestnet ? (
                      <NetSwitchTabs
                        showPending
                        size="sm"
                        value={selectedTab}
                        onTabChange={onTabChange}
                        className="ml-12"
                      />
                    ) : null}
                  </div>
                )}
                <div className="balance">
                  {isLoadingTokenList ? (
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
                      {curveData ? (
                        <div
                          className={classNames('balance-change', {
                            'is-loss': curveData.isLoss,
                          })}
                        >{`${curveData.isLoss ? '-' : '+'}${
                          curveData.changePercent
                        } (${curveData.change})`}</div>
                      ) : null}
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
              ) : (
                <div className="right">
                  <div className="absolute right-0 bottom-0 z-10">
                    <HomeUpdateButton
                      loading={
                        isLoadingRealTimeTokenList || isLoadingRealTimeProtocol
                      }
                      onUpdate={handleClickRefresh}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="relative flex-1 h-0">
            <Transactions
              isTestnet={selectedTab === 'testnet'}
              onTabChange={onTabChange}
              updateNonce={updateNonce}
            />
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
                    updateNonce={updateNonce}
                  />
                )}
                <ToolbarWrapper className="my-[12px]">
                  <div>
                    <TokenSearchInput ref={inputRef} onSearch={setSearch} />
                  </div>
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
                    <div
                      className={classNames('item', {
                        active: currentView === VIEW_TYPE.SUMMARY,
                      })}
                      onClick={() => switchView(VIEW_TYPE.SUMMARY)}
                    >
                      Summary
                    </div>
                  </div>
                </ToolbarWrapper>
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
                  tokenHiddenList,
                }}
                protocolHidden={{
                  isShowExpand: isShowProtocolExpand,
                  isExpand: isProtocolExpand,
                  hiddenCount: protocolHiddenCount,
                  hiddenUsdValue: protocolHiddenUsdValue,
                  setIsExpand: setIsProtocolExpand,
                }}
                isLoadingTokenList={isLoadingTokenList || isSearchingTokenList}
                isLoadingProtocolList={isLoadingProtocol}
                isLoadingProtocolHistory={isLoadingProtocolHistory}
                supportHistoryChains={supportHistoryChains}
                historyTokenDict={historyTokenDict}
                chainList={displayChainList}
                view={currentView}
                onFocusInput={onFocusInput}
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
