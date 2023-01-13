import { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { sortBy } from 'lodash';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { ellipsis } from '@/renderer/utils/address';
import { formatNumber } from '@/renderer/utils/number';
import useCurrentBalance from '@/renderer/hooks/useCurrentBalance';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import useHistoryProtocol, {
  DisplayProtocol,
} from '@/renderer/hooks/useHistoryProtocol';
import { message } from 'antd';
import ChainList from './components/ChainList';
import Curve from './components/Curve';
import PortfolioView from './components/PortfolioView';

const HomeWrapper = styled.div`
  padding-top: 76px;
  padding-left: 28px;
  padding-right: 358px;
  color: #fff;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  .header {
    width: 100%;
    margin-bottom: 20px;
    .top {
      display: flex;
      margin-bottom: 20px;
      max-width: 1375px;
      .left {
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
      font-weight: 590;
      font-size: 46px;
      line-height: 55px;
    }
  }
`;

const Home = () => {
  const { currentAccount } = useCurrentAccount();
  const [balance, chainBalances] = useCurrentBalance(
    currentAccount?.address,
    true
  );
  const [netCurve, setNetCurve] = useState<
    {
      timestamp: number;
      usd_value: number;
    }[]
  >([]);
  const [selectChainServerId, setSelectChainServerId] = useState<string | null>(
    null
  );
  const { usdValueChange, percentChange, isLoss } = useMemo(() => {
    if (!balance || netCurve.length <= 0)
      return { usdValueChange: '0', percentChange: '0' };
    const balanceBn = new BigNumber(balance);
    const yesterdayBalanceBn = new BigNumber(netCurve[0].usd_value);
    const gap = balanceBn.minus(yesterdayBalanceBn);
    let changePercent = 0;
    if (yesterdayBalanceBn.eq(0)) {
      if (balanceBn.eq(0)) {
        changePercent = 0;
      } else {
        changePercent = 1;
      }
    } else {
      changePercent = gap.div(yesterdayBalanceBn).toNumber();
    }
    return {
      usdValueChange: gap.abs().toFixed(2),
      percentChange: Math.abs(changePercent * 100).toFixed(2),
      isLoss: balanceBn.lt(yesterdayBalanceBn),
    };
  }, [netCurve, balance]);
  const curveData = useCurve(balance || 0, Date.now(), netCurve);
  const { tokenList, historyTokenMap } = useHistoryTokenList(
    currentAccount?.address
  );
  const displayTokenList = useMemo(() => {
    const list: TokenItem[] = [];
    const smallList: TokenItem[] = [];
    const l = selectChainServerId
      ? tokenList.filter((token) => token.chain === selectChainServerId)
      : tokenList;
    const totalUsdValue = l.reduce((sum, item) => {
      return sum + (item.usd_value || 0);
    }, 0);
    l.forEach((item) => {
      if (new BigNumber(item.usd_value || 0).div(totalUsdValue).gte(0.001)) {
        list.push(item);
      } else {
        smallList.push(item);
      }
    });
    return {
      defaultTokenList: sortBy(list, (i) => i.usd_value || 0).reverse(),
      smallBalanceTokenList: sortBy(
        smallList,
        (i) => i.usd_value || 0
      ).reverse(),
    };
  }, [tokenList, selectChainServerId]);
  const { protocolList, historyProtocolMap, tokenHistoryPriceMap } =
    useHistoryProtocol(currentAccount?.address);

  const displayProtocolList = useMemo(() => {
    const list: DisplayProtocol[] = [];
    const smallList: DisplayProtocol[] = [];
    const l = selectChainServerId
      ? protocolList.filter(
          (protocol) => protocol.chain === selectChainServerId
        )
      : protocolList;
    const totalUsdValue = l.reduce((sum, item) => {
      return sum + (item.usd_value || 0);
    }, 0);
    l.forEach((item) => {
      if (new BigNumber(item.usd_value || 0).div(totalUsdValue).gte(0.001)) {
        list.push(item);
      } else {
        smallList.push(item);
      }
    });
    return {
      defaultProtocolList: sortBy(
        sortBy(
          list.map((item) => {
            return {
              ...item,
              portfolio_item_list: sortBy(item.portfolio_item_list, (i) => {
                return (i.detail.supply_token_list || []).reduce(
                  (sum, j) => sum + j.price * j.amount,
                  0
                );
              }).reverse(),
            };
          })
        ),
        (i) => i.usd_value || 0
      ).reverse(),
      smallBalanceProtocolList: sortBy(
        smallList.map((item) => {
          return {
            ...item,
            portfolio_item_list: sortBy(item.portfolio_item_list, (i) => {
              return (i.detail.supply_token_list || []).reduce(
                (sum, j) => sum + j.price * j.amount,
                0
              );
            }).reverse(),
          };
        }),
        (i) => i.usd_value || 0
      ).reverse(),
    };
  }, [protocolList, selectChainServerId]);

  const init = async () => {
    if (!currentAccount?.address) return;
    const curve = await walletOpenapi.getNetCurve(currentAccount.address);
    setNetCurve(curve);
  };

  useEffect(() => {
    init();
  }, [currentAccount]);

  return (
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
                message.open({
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
            <div className="balance">${formatNumber(balance || 0)}</div>
          </div>
          <div className="right">
            <div
              className={classNames('balance-change', { 'is-loss': isLoss })}
            >{`${isLoss ? '-' : '+'}$${formatNumber(
              usdValueChange
            )} (${percentChange}%)`}</div>
            <Curve data={curveData} />
          </div>
        </div>
        <ChainList
          chainBalances={chainBalances}
          onChange={setSelectChainServerId}
        />
      </div>
      <PortfolioView
        tokenList={displayTokenList.defaultTokenList}
        historyTokenMap={historyTokenMap}
        protocolList={displayProtocolList.defaultProtocolList}
        historyProtocolMap={historyProtocolMap}
        protocolHistoryTokenPriceMap={tokenHistoryPriceMap}
        chainBalances={chainBalances}
        selectChainServerId={selectChainServerId}
      />
    </HomeWrapper>
  );
};

export default Home;
