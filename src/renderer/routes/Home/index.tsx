/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { sortBy } from 'lodash';
import { ellipsis } from '@/renderer/utils/address';
import { formatNumber } from '@/renderer/utils/number';
import { formatChain, DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import { useTotalBalance } from '@/renderer/utils/balance';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useBalanceValue } from '@/renderer/hooks/useCurrentBalance';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import useHistoryProtocol, {
  DisplayProtocol,
} from '@/renderer/hooks/useHistoryProtocol';
import { message } from 'antd';
import { toastMessage } from '@/renderer/components/TransparentToast';
import ChainList from './components/ChainList';
import Curve from './components/Curve';
import PortfolioView from './components/PortfolioView';
import RightBar from './components/RightBar';

const HomeBody = styled.div`
  display: flex;
  padding-top: 24px;
  padding-left: 28px;
  padding-right: 28px;
  min-height: calc(100vh - 64px);
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
      margin-bottom: 20px;
      .left {
        z-index: 1;
        margin-right: 40px;
      }
      .right {
        flex: 1;
        position: relative;
        .balance-change {
          position: absolute;
          right: 28px;
          top: 77px;
          font-weight: 500;
          font-size: 18px;
          line-height: 21px;
          margin-left: 6px;
          color: #2ed4a3;
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
      .icon-copy {
        cursor: pointer;
        margin-left: 6px;
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
          animation: spining 1.5s infinite linear;
        }
      }
      &:hover {
        .icon-refresh {
          display: block;
        }
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
const useExpandList = (tokens: TokenItem[]) => {
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
    const result = isExpand
      ? tokens
      : tokens.filter((item) => (item.amount * item.price || 0) >= filterPrice);
    return result;
  }, [isExpand, tokens, isShowExpand, filterPrice]);

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
  const { currentAccount } = useCurrentAccount();
  const [updateNonce, setUpdateNonce] = useState(0);
  const [_, updateBalanceValue] = useBalanceValue();

  const [selectChainServerId, setSelectChainServerId] = useState<string | null>(
    null
  );
  const [usedChainList, setUsedChainList] = useState<
    DisplayChainWithWhiteLogo[]
  >([]);

  const {
    tokenList,
    historyTokenMap,
    isLoading: isLoadingTokenList,
    isLoadingRealTime: isLoadingRealTimeTokenList,
  } = useHistoryTokenList(currentAccount?.address, updateNonce);

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
  } = useHistoryProtocol(currentAccount?.address, updateNonce);

  const {
    filterList: displayTokenList,
    isExpand: isTokenExpand,
    totalHidden: tokenHiddenUsdValue,
    totalHiddenCount: tokenHiddenCount,
    setIsExpand: setIsTokenExpand,
  } = useExpandList(filterTokenList);

  const totalBalance = useTotalBalance(tokenList, protocolList);

  const curveData = useCurve(
    currentAccount?.address,
    Number(totalBalance) || 0,
    Date.now()
  );

  const filterProtocolList = useMemo(() => {
    const list: DisplayProtocol[] = selectChainServerId
      ? protocolList.filter(
          (protocol) => protocol.chain === selectChainServerId
        )
      : protocolList;
    return sortBy(
      sortBy(
        list.map((item) => {
          item.portfolio_item_list = item.portfolio_item_list.map((i) => ({
            ...i,
            asset_token_list: sortBy(i.asset_token_list, (j) => {
              return j.amount * j.price;
            }).reverse(),
          }));
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
    isExpand: isProtocolExpand,
    totalHidden: protocolHiddenUsdValue,
    totalHiddenCount: protocolHiddenCount,
    setIsExpand: setIsProtocolExpand,
  } = useExpandProtocolList(filterProtocolList);

  const init = async () => {
    if (!currentAccount?.address) return;
    const chainList = await walletOpenapi.usedChainList(currentAccount.address);
    setUsedChainList(chainList.map((chain) => formatChain(chain)));
    setIsProtocolExpand(false);
    setIsTokenExpand(false);
  };

  const handleClickRefresh = () => {
    setUpdateNonce(updateNonce + 1);
  };

  useEffect(() => {
    init();
  }, [currentAccount]);

  useEffect(() => {
    if (!currentAccount) return;
    updateBalanceValue(totalBalance);
    walletController.updateAddressBalanceCache(
      currentAccount.address,
      totalBalance
    );
  }, [totalBalance, currentAccount]);

  return (
    <HomeBody>
      <HomeWrapper>
        <div className="header">
          <div className="top">
            <div className="left">
              <div
                className="current-address"
                onClick={async () => {
                  if (!currentAccount?.address) return;

                  await window.navigator.clipboard.writeText(
                    currentAccount.address
                  );
                  toastMessage({
                    type: 'success',
                    content: 'Copied Address',
                    className: 'mainwindow-default-tip',
                    duration: 1,
                  });
                }}
              >
                {ellipsis(currentAccount?.address || '')}
                <img
                  className="icon-copy"
                  src="rabby-internal://assets/icons/home/copy.svg"
                />
              </div>
              <div className="balance">
                ${formatNumber(totalBalance || 0)}{' '}
                <img
                  src="rabby-internal://assets/icons/home/asset-update.svg"
                  className={classNames('icon-refresh', {
                    circling:
                      isLoadingRealTimeTokenList || isLoadingRealTimeProtocol,
                  })}
                  onClick={handleClickRefresh}
                />
              </div>
            </div>
            {curveData ? (
              <div className="right">
                <div
                  className={classNames('balance-change', {
                    'is-loss': curveData.isLoss,
                  })}
                >{`${curveData.isLoss ? '-' : '+'}${curveData.changePercent} (${
                  curveData.change
                })`}</div>
                {curveData.list.length > 0 && <Curve data={curveData} />}
              </div>
            ) : null}
          </div>
          <ChainList
            chainBalances={usedChainList}
            onChange={setSelectChainServerId}
          />
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
            setIsExpand: setIsTokenExpand,
          }}
          protocolHidden={{
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
        />
      </HomeWrapper>
      <RightBar />
    </HomeBody>
  );
};

export default Home;
