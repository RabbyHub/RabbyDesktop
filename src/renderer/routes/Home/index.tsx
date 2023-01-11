import { useEffect, useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { sortBy } from 'lodash';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import useCurrentBalance from '@/renderer/hooks/useCurrentBalance';
import { ellipsis } from '@/renderer/utils/address';
import { formatNumber } from '@/renderer/utils/number';
import useCurve from '@/renderer/hooks/useCurve';
import useHistoryTokenList from '@/renderer/hooks/useHistoryTokenList';
import ChainList from './components/ChainList';
import Curve from './components/Curve';
import PortfolioView from './components/PortfolioView';

const HomeWrapper = styled.div`
  padding-top: 76px;
  padding-left: 50px;
  padding-right: 336px;
  color: #fff;
  .header {
    width: 100%;
    margin-bottom: 20px;
    .top {
      display: flex;
      margin-bottom: 20px;
      .left {
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
      .icon-copy {
        cursor: pointer;
        margin-left: 6px;
      }
    }
    .balance {
      font-weight: 590;
      font-size: 46px;
      line-height: 55px;
      .balance-change {
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
    const yestordayBalanceBn = new BigNumber(netCurve[0].usd_value);
    const gap = balanceBn.minus(yestordayBalanceBn);
    let changePercent = 0;
    if (yestordayBalanceBn.eq(0)) {
      if (balanceBn.eq(0)) {
        changePercent = 0;
      } else {
        changePercent = 1;
      }
    } else {
      changePercent = gap.div(yestordayBalanceBn).toNumber();
    }
    return {
      usdValueChange: gap.abs().toFixed(2),
      percentChange: Math.abs(changePercent * 100).toFixed(2),
      isLoss: balanceBn.lt(yestordayBalanceBn),
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

  const init = async () => {
    if (!currentAccount) return;
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
            <div className="current-address">
              {ellipsis(currentAccount?.address || '')}
              <img
                className="icon-copy"
                src="rabby-internal://assets/icons/home/copy.svg"
              />
            </div>
            <div className="balance">
              {formatNumber(balance || 0)}
              <span
                className={classNames('balance-change', { 'is-loss': isLoss })}
              >{`${isLoss ? '-' : '+'}${formatNumber(
                usdValueChange
              )} (${percentChange}%)`}</span>
            </div>
          </div>
          <div className="right">
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
      />
    </HomeWrapper>
  );
};

export default Home;
