import { useCallback, useMemo } from 'react';
import { Skeleton } from 'antd';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useProtocolDappsBinding } from '@/renderer/hooks/useDappsMngr';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { formatUsdValue } from '@/renderer/utils/number';
import PoolItem, { LoadingPoolItem } from './PoolItem';

const ProtocolItemWrapper = styled.div`
  margin-bottom: 27px;
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
  padding-left: 22px;
  padding-right: 22px;
  align-items: flex-end;
  .protocol-name {
    margin-left: 8px;
    font-weight: 700;
    font-size: 12px;
    line-height: 14px;
    color: #fff;
    text-transform: uppercase;
  }
  .token-with-chain {
    .chain-logo {
      width: 8px;
      height: 8px;
      bottom: -2.5px;
      right: -2.5px;
    }
  }
  .protocol-usd {
    font-weight: 700;
    font-size: 15px;
    line-height: 18px;
    text-align: right;
    color: #ffffff;
  }
  .protocol-info {
    display: flex;
    align-items: center;
    .icon-relate {
      cursor: pointer;
      margin-left: 8px;
      width: 14px;
      display: none;
    }
    .protocol-bind {
      display: none;
      width: 14px;
      align-items: center;
      .protocol-dapp {
        white-space: nowrap;
        margin-left: 12px;
        font-weight: 400;
        font-size: 12px;
        line-height: 14px;
        color: rgba(255, 255, 255, 0.5);
      }
      .icon-edit {
        cursor: pointer;
        margin-left: 2px;
      }
      .icon-relate {
        margin-left: 3px;
      }
    }
    &.has-bind {
      .protocol-name {
        cursor: pointer;
        &:hover {
          color: #8697ff;
          text-decoration: underline;
        }
      }
    }
    &:hover {
      .icon-relate {
        display: block;
      }
      .protocol-bind {
        display: flex;
      }
    }
  }
`;

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
  const openDapp = useOpenDapp();

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

  return (
    <ProtocolItemWrapper>
      <ProtocolHeader>
        <IconWithChain
          iconUrl={protocol.logo_url}
          chainServerId={protocol.chain}
          width="14px"
          height="14px"
          noRound
        />
        <div className="flex-1">
          <div
            className={classNames('protocol-info', {
              'has-bind': hasBinded,
            })}
          >
            <span className="protocol-name" onClick={handleClickProtocolName}>
              {protocol.name}
            </span>
            {!hasBinded && (
              <img
                src="rabby-internal://assets/icons/home/dapp-relate.svg"
                className="icon-relate"
                onClick={() => onClickRelate(protocol)}
              />
            )}
            {hasBinded && (
              <div className="protocol-bind">
                <span className="protocol-dapp">{bindUrl}</span>
                {protocolDappsBinding[protocol.id] ? (
                  <img
                    src="rabby-internal://assets/icons/home/bind-edit.svg"
                    alt=""
                    className="icon-edit"
                    onClick={() => onClickRelate(protocol)}
                  />
                ) : (
                  <img
                    src="rabby-internal://assets/icons/home/dapp-relate.svg"
                    className="icon-relate"
                    onClick={() => onClickRelate(protocol)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <span className="protocol-usd">
          {formatUsdValue(protocol.usd_value)}
        </span>
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
