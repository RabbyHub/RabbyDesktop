import { useEffect, useState, useMemo, useRef } from 'react';
import { Skeleton } from 'antd';
import { usePrevious } from 'react-use';
import styled from 'styled-components';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';
import { ServerChain, TokenItem } from '@debank/rabby-api/dist/types';
import { sortBy } from 'lodash';
import { ellipsis } from '@/renderer/utils/address';
import { formatNumber } from '@/renderer/utils/number';
import { formatChain, DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { useTotalBalance } from '@/renderer/utils/balance';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import useHistoryProtocol, {
  DisplayProtocol,
} from '@/renderer/hooks/useHistoryProtocol';
import { toastCopiedWeb3Addr } from '@/renderer/components/TransparentToast';
import { copyText } from '@/renderer/utils/clipboard';
import BigNumber from 'bignumber.js';
import {
  useZPopupLayerOnMain,
  useZViewsVisibleChanged,
} from '@/renderer/hooks/usePopupWinOnMainwin';
import { useSwitchView, VIEW_TYPE } from './hooks';

import ChainList from './components/ChainList';
import Curve, { CurveModal } from './components/Curve';
import PortfolioView from './components/PortfolioView';
import RightBar from './components/RightBar';

const HomeBody = styled.div`
  display: flex;
  padding-top: 24px;
  padding-left: 28px;
  padding-right: 28px;
  height: calc(100vh - 64px - var(--mainwin-mainroute-topoffset));
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
    margin-bottom: 5px;
    .top {
      display: flex;
      margin-bottom: 20px;
      .left {
        z-index: 2;
        margin-right: 40px;
      }
      .right {
        flex: 1;
        position: relative;
        .balance-change {
          position: absolute;
          top: 0;
          right: 0;
          width: 600px;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding-right: 28px;
          font-weight: 500;
          font-size: 18px;
          line-height: 21px;
          margin-left: 6px;
          color: #2ed4a3;
          z-index: 1;
          cursor: pointer;
          &.is-loss {
            color: #ff6060;
          }
        }
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
      line-height: 55px;
      display: flex;
      align-items: center;
      .icon-refresh {
        display: none;
        cursor: pointer;
        margin-left: 14px;
        @keyframes spining {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        &.circling {
          display: block;
          animation: spining 1.5s infinite linear;
        }
      }
    }
    &:hover {
      .icon-refresh {
        display: block;
      }
    }
  }
`;

const SwitchViewWrapper = styled.div`
  flex: 1;
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

const calcFilterPrice = (tokens: { usd_value?: number }[]) => {
  const total = tokens.reduce((t, item) => (item.usd_value || 0) + t, 0);
  return Math.min(total / 100, 1000);
};
const calcIsShowExpand = (tokens: { usd_value?: number }[]) => {
  const filterPrice = calcFilterPrice(tokens);
  if (tokens.length < 15) {
    return false;
  }
  if (tokens.filter((item) => (item.usd_value || 0) < filterPrice).length < 3) {
    return false;
  }
  return true;
};
const useExpandList = (
  tokens: TokenItem[],
  historyTokenMap: null | Record<string, TokenItem>,
  supportHistoryChains: ServerChain[]
) => {
  const [isExpand, setIsExpand] = useState(false);
  const filterPrice = useMemo(() => calcFilterPrice(tokens), [tokens]);
  const isShowExpand = useMemo(() => calcIsShowExpand(tokens), [tokens]);
  const { totalHidden, totalHiddenCount } = useMemo(() => {
    if (!isShowExpand) {
      return {
        totalHidden: 0,
        totalHiddenCount: 0,
      };
    }
    return {
      totalHidden: tokens.reduce((t, item) => {
        const price = item.amount * item.price || 0;
        if (price < filterPrice) {
          return t + price;
        }
        return t;
      }, 0),
      totalHiddenCount: tokens.filter((item) => {
        const price = item.amount * item.price || 0;
        return price < filterPrice;
      }).length,
    };
  }, [tokens, filterPrice, isShowExpand]);
  const filterList = useMemo(() => {
    if (!isShowExpand) {
      return tokens;
    }
    if (isExpand) {
      return tokens;
    }
    return tokens.filter(
      (item) => (item.amount * item.price || 0) >= filterPrice
    );
  }, [isExpand, tokens, isShowExpand, filterPrice]);
  const omitTokens = tokens.filter(
    (item) => (item.amount * item.price || 0) < filterPrice
  );
  const usdValueChange = historyTokenMap
    ? omitTokens.reduce((sum, item) => {
        const key = `${item.chain}-${item.id}`;
        const history = historyTokenMap[key];
        if (!history) {
          return sum + new BigNumber(item.amount).times(item.price).toNumber();
        }
        if (supportHistoryChains.find((chain) => chain.id === item.chain)) {
          return (
            sum +
            (new BigNumber(item.amount).times(item.price).toNumber() -
              new BigNumber(history.amount).times(history.price).toNumber())
          );
        }
        return (
          sum +
          (new BigNumber(item.amount).times(item.price).toNumber() -
            new BigNumber(item.amount).times(history.price).toNumber())
        );
      }, 0)
    : 0;

  return {
    isExpand,
    setIsExpand,
    filterList,
    filterPrice,
    isShowExpand,
    totalHidden,
    totalHiddenCount,
    usdValueChange,
  };
};
const useExpandProtocolList = (protocols: DisplayProtocol[]) => {
  const [isExpand, setIsExpand] = useState(false);
  const filterPrice = useMemo(() => calcFilterPrice(protocols), [protocols]);
  const isShowExpand = useMemo(() => calcIsShowExpand(protocols), [protocols]);
  const { totalHidden, totalHiddenCount } = useMemo(() => {
    return {
      totalHidden: protocols.reduce((t, item) => {
        const price = item.usd_value || 0;
        if (price < filterPrice) {
          return t + price;
        }
        return t;
      }, 0),
      totalHiddenCount: protocols.filter((item) => {
        const price = item.usd_value || 0;
        return price < filterPrice;
      }).length,
    };
  }, [protocols, filterPrice]);
  const filterList = useMemo(() => {
    if (!isShowExpand) {
      return protocols;
    }
    const result = isExpand
      ? protocols
      : protocols.filter((item) => (item.usd_value || 0) >= filterPrice);
    return result;
  }, [isExpand, protocols, isShowExpand, filterPrice]);

  return {
    isExpand,
    setIsExpand,
    filterList,
    filterPrice,
    isShowExpand,
    totalHidden,
    totalHiddenCount,
  };
};

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

  const filterTokenList = useMemo(() => {
    const list: TokenItem[] = selectChainServerId
      ? tokenList.filter((token) => token.chain === selectChainServerId)
      : tokenList;
    return sortBy(list, (i) => i.usd_value || 0).reverse();
  }, [tokenList, selectChainServerId]);

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

  const filterProtocolList = useMemo(() => {
    const list: DisplayProtocol[] = selectChainServerId
      ? protocolList.filter(
          (protocol) => protocol.chain === selectChainServerId
        )
      : protocolList;
    return sortBy(
      sortBy(
        list.map((item) => {
          item.portfolio_item_list = item.portfolio_item_list.map((i) => {
            const assetList = i.asset_token_list;
            let positiveList: TokenItem[] = [];
            let negativeList: TokenItem[] = [];
            assetList.forEach((j) => {
              if (j.amount < 0) {
                negativeList.push(j);
              } else {
                positiveList.push(j);
              }
            });
            positiveList = sortBy(
              positiveList,
              (j) => j.amount * j.price
            ).reverse();
            negativeList = sortBy(
              negativeList,
              (j) => Math.abs(j.amount) * j.price
            ).reverse();
            return {
              ...i,
              asset_token_list: [...positiveList, ...negativeList],
            };
          });
          return {
            ...item,
            portfolio_item_list: sortBy(item.portfolio_item_list, (i) => {
              return (i.asset_token_list || []).reduce(
                (sum, j) => sum + j.price * j.amount,
                0
              );
            }).reverse(),
          };
        })
      ),
      (i) => i.usd_value || 0
    ).reverse();
  }, [protocolList, selectChainServerId]);
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
                        height: '21px',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                ) : (
                  <div className="current-address">
                    <span
                      className="inline-flex items-center"
                      onClick={async () => {
                        if (!currentAccount?.address) return;

                        await copyText(currentAccount.address);
                        toastCopiedWeb3Addr(currentAccount.address);
                      }}
                    >
                      {ellipsis(currentAccount?.address || '')}
                      <img
                        className="icon"
                        src="rabby-internal://assets/icons/home/copy.svg"
                      />
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
                      <img
                        className="icon"
                        src="rabby-internal://assets/icons/home/info.svg"
                      />
                    </span>
                  </div>
                )}
                <div className="balance">
                  {isLoadingTokenList ? (
                    <Skeleton.Input
                      active
                      style={{
                        width: '234px',
                        height: '43px',
                        borderRadius: '2px',
                      }}
                    />
                  ) : (
                    <>
                      ${formatNumber(totalBalance || 0)}{' '}
                      <img
                        src="rabby-internal://assets/icons/home/asset-update.svg"
                        className={classNames('icon-refresh', {
                          circling:
                            isLoadingRealTimeTokenList ||
                            isLoadingRealTimeProtocol,
                        })}
                        onClick={handleClickRefresh}
                      />
                    </>
                  )}
                </div>
              </div>

              {curveData ? (
                <div className="right" onClick={() => setCurveModalOpen(true)}>
                  {isLoadingTokenList ? (
                    <div className="balance-change">
                      <Skeleton.Input
                        active
                        style={{
                          width: '141px',
                          height: '21px',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div
                        className={classNames('balance-change', {
                          'is-loss': curveData.isLoss,
                        })}
                      >{`${curveData.isLoss ? '-' : '+'}${
                        curveData.changePercent
                      } (${curveData.change})`}</div>
                      {curveData.list.length > 0 && <Curve data={curveData} />}
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex justify-between items-center">
              {isLoadingTokenList ? (
                <Skeleton.Input
                  active
                  style={{
                    width: '141px',
                    height: '21px',
                    borderRadius: '2px',
                  }}
                />
              ) : (
                <ChainList
                  chainBalances={displayChainList}
                  onChange={setSelectChainServerId}
                />
              )}
              <SwitchViewWrapper>
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
