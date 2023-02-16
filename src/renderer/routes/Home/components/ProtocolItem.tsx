import { useCallback, useMemo } from 'react';
import { Skeleton } from 'antd';
import styled from 'styled-components';
import classNames from 'classnames';
import { TokenItem } from '@debank/rabby-api/dist/types';
import { useProtocolDappsBinding } from '@/renderer/hooks/useDappsMngr';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
// import { hasSameOrigin } from '@/isomorphic/url';
import { useOpenDapp } from '@/renderer/utils/react-router';
import PoolItem, { LoadingPoolItem } from './PoolItem';

const ProtocolItemWrapper = styled.div`
  margin-bottom: 27px;
  .protocol-info {
    display: flex;
    padding-left: 25px;
    margin-bottom: 10px;
    align-items: center;
    .protocol-name {
      margin-left: 8px;
      font-weight: 700;
      font-size: 12px;
      line-height: 14px;
      color: rgba(169, 173, 185, 0.6);
      text-transform: uppercase;
    }
    .token-with-chain {
      opacity: 0.6;
      .chain-logo {
        width: 8px;
        height: 8px;
        bottom: -2.5px;
        right: -2.5px;
      }
    }
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
  .protocol-list {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
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
      <div
        className={classNames('protocol-info', {
          'has-bind': hasBinded,
        })}
      >
        <IconWithChain
          iconUrl={protocol.logo_url}
          chainServerId={protocol.chain}
          width="14px"
          height="14px"
          noRound
        />
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
