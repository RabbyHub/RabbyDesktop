import { useMemo, useCallback } from 'react';
import classNames from 'classnames';
import styled from 'styled-components';
import { Tooltip } from 'antd';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import { useProtocolDappsBinding } from '@/renderer/hooks/useDappsMngr';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { formatUsdValue } from '@/renderer/utils/number';
import * as Template from '../templates';

const TemplateDict = {
  common: Template.Common,
  lending: Template.Lending,
  locked: Template.Locked,
  leveraged_farming: Template.LeveragedFarming,
  vesting: Template.Vesting,
  reward: Template.Reward,
  options_seller: Template.OptionsSeller,
  // /* 期权 买卖方暂时用同一个 */
  options_buyer: Template.OptionsSeller,
  insurance_seller: Template.InsuranceSeller,
  insurance_buyer: Template.InsuranceBuyer,
  perpetuals: Template.Perpetuals,
};

const ProtocolItemWrapper = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  position: relative;
  margin-bottom: 12px;
  padding-top: 40px;
  .extra-info {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    .tag {
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
    .proxy-info {
      font-weight: 500;
      font-size: 12px;
      line-height: 14px;
      margin-left: 10px;
      color: rgba(255, 255, 255, 0.6);
    }
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

const ProtocolWrapper = styled.div`
  margin-bottom: 28px;
`;

const DefaultProtocolItem = ({
  protocol,
  onClickRelate,
}: {
  protocol: DisplayProtocol;
  onClickRelate(protocol: DisplayProtocol): void;
}) => {
  const typesMap = new Map<string, typeof protocol.portfolio_item_list>();
  protocol.portfolio_item_list.forEach((v) => {
    const detail_type = v.detail_types
      ?.reverse()
      ?.find((type) =>
        TemplateDict[type as keyof typeof TemplateDict] ? type : ''
      );

    const mapKey = `${v.name}&&${detail_type}&&${v.proxy_detail?.proxy_contract_id}`;
    const _arr = typesMap.get(mapKey) || [];
    _arr.push(v);
    typesMap.set(mapKey, _arr);
  });

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
    <ProtocolWrapper>
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
      {[...typesMap].map(([k, v]) => {
        // 需要根据 common 匹配对应模板
        const [tag, type] = k.split('&&');
        const PortfolioDetail = TemplateDict[type as keyof typeof TemplateDict];

        return (
          PortfolioDetail && (
            <>
              <ProtocolItemWrapper>
                <div className="extra-info">
                  <div className="tag">{tag}</div>
                  {v[0]?.proxy_detail?.project && (
                    <div className="proxy-info">
                      Proxy:{' '}
                      <Tooltip title={v[0].proxy_detail?.proxy_contract_id}>
                        <span className="cursor-pointer">
                          {v[0].proxy_detail.project.name}
                        </span>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <PortfolioDetail data={v} />
              </ProtocolItemWrapper>
            </>
          )
        );
      })}
    </ProtocolWrapper>
  );
};

export default DefaultProtocolItem;
