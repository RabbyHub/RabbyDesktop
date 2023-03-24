import {
  useCallback,
  useMemo,
  useState,
  useRef,
  ReactNode,
  useContext,
  useEffect,
} from 'react';
import { Skeleton, Popover } from 'antd';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useClickAway } from 'react-use';
import { useProtocolDappsBinding } from '@/renderer/hooks/useDappsMngr';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { formatUsdValue } from '@/renderer/utils/number';
import { removeProtocolFromUrl } from '@/renderer/utils/url';
import IconRcMore from '@/../assets/icons/home/more.svg?rc';
import PoolItem, { LoadingPoolItem } from './PoolItem';
import ScrollTopContext from './scrollTopContext';

const ProtocolItemWrapper = styled.div`
  margin-bottom: 20px;
  /* .protocol-list {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  } */
  .tag {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(255, 255, 255, 0.12);
    font-size: 12px;
    line-height: 14px;
    color: #ffffff;
    padding: 5px 22px;
    text-align: center;
    top: 0;
    left: 0;
    border-top-left-radius: 12px;
    border-bottom-right-radius: 4px;
  }
`;

const ProtocolHeader = styled.div`
  display: flex;
  margin-bottom: 20px;
  padding-left: 25px;
  padding-right: 22px;
  align-items: flex-end;
  .token-with-chain {
    .chain-logo {
      width: 12px;
      height: 12px;
      bottom: -4px;
      right: -4px;
    }
  }
  .protocol-usd {
    font-weight: 700;
    font-size: 15px;
    line-height: 18px;
    text-align: right;
    color: #ffffff;
    position: relative;
    width: 20%;
  }
  .protocol-info {
    display: inline-flex;
    align-items: center;
    margin-left: 12px;
    position: relative;
    cursor: pointer;
    .protocol-name {
      font-weight: 700;
      font-size: 15px;
      line-height: 18px;
      color: #fff;
      text-transform: uppercase;
    }
    .icon-relate {
      cursor: pointer;
      margin-left: 6px;
      width: 12px;
    }
    .protocol-bind {
      display: flex;
      align-items: center;
      .protocol-dapp {
        white-space: nowrap;
        margin-left: 6px;
        font-weight: 400;
        font-size: 12px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.5);
      }
    }
    &::after {
      content: '';
      height: 1px;
      width: 100%;
      position: absolute;
      left: 0;
      bottom: -2px;
      background-color: rgba(255, 255, 255, 0.5);
    }
    &.has-bind {
      .protocol-name {
        color: #8697ff;
      }
      .protocol-dapp {
        color: #8697ff;
      }
      &::after {
        background-color: #8697ff;
      }
    }
  }
  .icon-edit {
    cursor: pointer;
    margin-left: 8px;
  }
`;

const UsdValueChangeWrapper = styled.div`
  width: 100%;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #c6c6c6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &.is-loss {
    color: #ff6565;
  }
  &.is-increase {
    color: #4aebbb;
  }
`;

const RemoveBindingWrapper = styled.div`
  display: flex;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  line-height: 17px;
  align-items: center;
  .icon-unbind {
    margin-right: 8px;
  }
`;

const RemoveBinding = ({
  children,
  onClick,
  onClickOutSide,
}: {
  children: ReactNode;
  onClick(): void;
  onClickOutSide(): void;
}) => {
  const wrapper = useRef(null);
  useClickAway(wrapper, () => {
    onClickOutSide();
  });
  return (
    <RemoveBindingWrapper ref={wrapper} onClick={onClick}>
      {children}
    </RemoveBindingWrapper>
  );
};

const ProtocolItem = ({
  protocol,
  historyProtocol,
  protocolHistoryTokenPriceMap,
  onClickRelate,
  supportHistory,
  isLoadingProtocolHistory,
  historyTokenDict,
}: {
  protocol: DisplayProtocol;
  historyProtocol?: DisplayProtocol;
  protocolHistoryTokenPriceMap: Record<
    string,
    { id: string; chain: string; price: number }
  >;
  onClickRelate(protocol: DisplayProtocol): void;
  supportHistory: boolean;
  isLoadingProtocolHistory: boolean;
  historyTokenDict: Record<string, TokenItem>;
}) => {
  const { protocolDappsBinding } = useProtocolDappsBinding();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const openDapp = useOpenDapp();
  const scrollTop = useContext(ScrollTopContext);

  const { hasBinded, bindUrl } = useMemo(() => {
    const arr = Object.values(protocolDappsBinding);
    const t = arr.find((item) => item.siteUrl === protocol.site_url);

    if (protocolDappsBinding[protocol.id]) {
      return {
        hasBinded: true,
        bindUrl: protocolDappsBinding[protocol.id].origin,
      };
    }

    if (t) {
      return {
        hasBinded: true,
        bindUrl: t.origin,
      };
    }

    return {
      hasBinded: !!protocolDappsBinding[protocol.id],
      bindUrl: protocolDappsBinding[protocol.id]
        ? protocolDappsBinding[protocol.id].origin
        : '',
    };
  }, [protocolDappsBinding, protocol]);

  const handleClickProtocolName = useCallback(() => {
    if (bindUrl) openDapp(bindUrl);
  }, [bindUrl, openDapp]);

  const historyProtocolUsdValue = useMemo(() => {
    let sum = 0;
    if (isLoadingProtocolHistory) return null;
    protocol.portfolio_item_list.forEach((portfolio) => {
      const historyPortfolio = historyProtocol?.portfolio_item_list.find(
        (item) =>
          item.pool.id === portfolio.pool.id &&
          item.position_index === portfolio.position_index
      );
      if (historyPortfolio) {
        const change = historyPortfolio.stats.net_usd_value;
        sum += change;
      } else if (!supportHistory) {
        const change = portfolio.asset_token_list.reduce((res, item) => {
          const tokenHistoryPrice =
            protocolHistoryTokenPriceMap[`${item.chain}-${item.id}`];
          if (tokenHistoryPrice) {
            return tokenHistoryPrice.price * item.amount;
          }
          return res;
        }, 0);
        sum += change;
      } else {
        const change = portfolio.asset_token_list.reduce((res, item) => {
          return res + item.price * item.amount;
        }, 0);
        sum += change;
      }
    });
    const valueChange = protocol.usd_value - sum;
    let percentage = valueChange === 0 ? 0 : valueChange / sum;
    if (sum === 0 && valueChange !== 0) {
      percentage = 1;
    }
    return {
      historyUsdValueChange: protocol.usd_value - sum,
      percentage,
    };
  }, [
    protocol,
    historyProtocol,
    protocolHistoryTokenPriceMap,
    supportHistory,
    isLoadingProtocolHistory,
  ]);

  const handleClickEditBind = () => {
    setPopoverOpen(false);
    onClickRelate(protocol);
  };

  useEffect(() => {
    setPopoverOpen(false);
  }, [scrollTop]);

  return (
    <ProtocolItemWrapper>
      <ProtocolHeader>
        <IconWithChain
          iconUrl={protocol.logo_url}
          chainServerId={protocol.chain}
          width="20px"
          height="20px"
          noRound
        />
        <div className="flex flex-1 items-center">
          <div
            className={classNames('protocol-info', {
              'has-bind': hasBinded,
            })}
            onClick={() =>
              hasBinded ? handleClickProtocolName() : onClickRelate(protocol)
            }
          >
            <span className="protocol-name">{protocol.name}</span>
            {!hasBinded && (
              <img
                src="rabby-internal://assets/icons/home/dapp-relate.svg"
                className="icon-relate"
              />
            )}
            {hasBinded && (
              <div className="protocol-bind">
                <span className="protocol-dapp">
                  ({removeProtocolFromUrl(bindUrl)})
                </span>
              </div>
            )}
          </div>
          {hasBinded && (
            <Popover
              trigger="click"
              content={
                <RemoveBinding
                  onClick={handleClickEditBind}
                  onClickOutSide={() => setPopoverOpen(false)}
                >
                  <img
                    className="icon-unbind"
                    src="rabby-internal://assets/icons/home/bind-edit.svg"
                  />
                  Edit binded Dapp
                </RemoveBinding>
              }
              placement="bottomLeft"
              showArrow={false}
              overlayClassName="remove-binding-popover"
              open={popoverOpen}
            >
              <IconRcMore
                className="icon-edit"
                onClick={() => setPopoverOpen(true)}
              />
            </Popover>
          )}
        </div>
        <div className="protocol-usd">
          <div className="mb-[4px]">{formatUsdValue(protocol.usd_value)}</div>
          {historyProtocolUsdValue && (
            <UsdValueChangeWrapper
              className={classNames('price-change absolute -bottom-12', {
                'is-loss': historyProtocolUsdValue.historyUsdValueChange < 0,
                'is-increase':
                  historyProtocolUsdValue.historyUsdValueChange > 0,
              })}
            >{`${
              historyProtocolUsdValue.historyUsdValueChange >= 0 ? '+' : '-'
            }${Math.abs(historyProtocolUsdValue.percentage * 100).toFixed(
              2
            )}% (${formatUsdValue(
              historyProtocolUsdValue.historyUsdValueChange
            )})`}</UsdValueChangeWrapper>
          )}
        </div>
      </ProtocolHeader>
      <div className="protocol-list">
        {protocol.portfolio_item_list.map((portfolio) => (
          <PoolItem
            portfolio={portfolio}
            historyProtocol={historyProtocol}
            protocolHistoryTokenPriceMap={protocolHistoryTokenPriceMap}
            key={`${portfolio.position_index}-${portfolio.pool.id}`}
            supportHistory={supportHistory}
            historyTokenDict={historyTokenDict}
            isLoadingProtocolHistory={isLoadingProtocolHistory}
          />
        ))}
      </div>
    </ProtocolItemWrapper>
  );
};

export const LoadingProtocolItem = () => {
  return (
    <ProtocolItemWrapper>
      <div className="protocol-info">
        <Skeleton.Input
          active
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '2px',
          }}
        />
        <span className="protocol-name">
          <Skeleton.Input
            active
            style={{
              width: '76px',
              height: '20px',
              borderRadius: '2px',
            }}
          />
        </span>
      </div>
      <div className="protocol-list">
        <LoadingPoolItem />
      </div>
    </ProtocolItemWrapper>
  );
};

export default ProtocolItem;
