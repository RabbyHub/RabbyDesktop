import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useContext,
} from 'react';
import classNames from 'classnames';
import styled from 'styled-components';
import { Tooltip, Popover } from 'antd';
import { useClickAway } from 'react-use';
import { DisplayProtocol } from '@/renderer/hooks/useHistoryProtocol';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import {
  useProtocolDappsBinding,
  useTabedDapps,
} from '@/renderer/hooks/useDappsMngr';
import IconRcMore from '@/../assets/icons/home/more.svg?rc';
import { useOpenDapp } from '@/renderer/utils/react-router';
import { formatUsdValue } from '@/renderer/utils/number';
import {
  isSameOrigin,
  isSameDomain,
  removeProtocolFromUrl,
} from '@/renderer/utils/url';
import { formatDappURLToShow } from '@/isomorphic/dapp';
import { checkIsCexProtocol } from '@/renderer/hooks/useBundle/cex/utils/shared';
import { fetchProtocolDappsBinding } from '../../../ipcRequest/dapps';
import * as Template from '../templates';
import ScrollTopContext from './scrollTopContext';

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
  nft_common: Template.NFTCommon,
  nft_lending: Template.NFTLending,
  nft_fraction: Template.NFTFraction,
  nft_p2p_borrower: Template.NFTP2PBorrower,
  nft_p2p_lender: Template.NFTP2PLender,
  cex: Template.Cex,
};

const ProtocolItemWrapper = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  position: relative;
  margin-bottom: 12px;
  padding-top: 36px;
  overflow: hidden;
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
      /* border-top-left-radius: 12px; */
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
  margin-bottom: 28px;
  align-items: flex-end;
  padding: 0 4px;
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
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 350px;
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

const ProtocolWrapper = styled.div`
  margin-bottom: 20px;
  padding-left: 14px;
  padding-right: 14px;
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
  const { dapps } = useTabedDapps();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const scrollTop = useContext(ScrollTopContext);
  const { protocolDappsBinding, bindingDappsToProtocol } =
    useProtocolDappsBinding();
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

  const autoBindDapp = useCallback(async () => {
    const dappBindings = await fetchProtocolDappsBinding();
    const siteUrl = protocol.site_url;
    const sameOrigin = dapps.find((dapp) =>
      isSameOrigin(dapp.origin, protocol.site_url)
    );
    const sameDomain = dapps.find((dapp) =>
      isSameDomain(dapp.origin, protocol.site_url)
    );
    if (dappBindings[protocol.id]) return;
    if (sameOrigin || sameDomain) {
      const target = sameOrigin || sameDomain;
      bindingDappsToProtocol(protocol.id, {
        origin: target!.origin,
        siteUrl,
      });
    }
  }, [bindingDappsToProtocol, dapps, protocol]);

  useEffect(() => {
    autoBindDapp();
  }, [autoBindDapp]);

  const handleClickEditBind = () => {
    setPopoverOpen(false);
    onClickRelate(protocol);
  };

  useEffect(() => {
    setPopoverOpen(false);
  }, [scrollTop]);

  const isCex = checkIsCexProtocol(protocol.id);

  return (
    <ProtocolWrapper>
      <ProtocolHeader>
        <IconWithChain
          iconUrl={protocol.logo_url}
          chainServerId={protocol.chain}
          width="20px"
          height="20px"
          noRound
          hideChainIcon={isCex}
        />
        <div className="flex flex-1 items-center">
          {isCex ? (
            <div className="protocol-info after:content-[none]">
              <span className="protocol-name normal-case">{protocol.name}</span>
            </div>
          ) : (
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
                    (
                    {/^https:\/\//.test(bindUrl)
                      ? removeProtocolFromUrl(bindUrl)
                      : formatDappURLToShow(bindUrl, { dapps })}
                    )
                  </span>
                </div>
              )}
            </div>
          )}
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
                  Edit bound Dapp
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
        <div className="protocol-usd flex items-center justify-end gap-[7px]">
          <span>{formatUsdValue(protocol.usd_value)}</span>
          {isCex && (
            <Tooltip
              overlayClassName="max-w-full"
              title={
                <div className="whitespace-nowrap">
                  {
                    'Options, assets < $10 or < 0.01% of total balance are not included'
                  }
                </div>
              }
            >
              <img
                className="cursor-pointer"
                src="rabby-internal://assets/icons/bundle/help.svg"
              />
            </Tooltip>
          )}
        </div>
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
