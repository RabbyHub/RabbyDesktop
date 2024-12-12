/* eslint-disable react/jsx-curly-brace-presence */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { useTranslation } from 'react-i18next';
import ImgLock from '@/../assets/icons/swap/lock.svg';
import ImgGas from '@/..//assets/icons/swap/gas.svg';
import RCIconDuration from '@/../assets/icons/bridge/duration.svg?rc';
import clsx from 'clsx';
import BigNumber from 'bignumber.js';
import { Tooltip } from 'antd';
import styled from 'styled-components';
import RcIconInfo from '@/../assets/icons/common/info-cc.svg?rc';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import { formatTokenAmount, formatUsdValue } from '@/renderer/utils/number';
import {
  SelectedBridgeQuote,
  useSetQuoteVisible,
  useSetSettingVisible,
} from '../hooks';
import { QuoteLogo } from './QuoteLogo';

const ItemWrapper = styled.div`
  position: relative;
`;

interface QuoteItemProps extends SelectedBridgeQuote {
  payAmount: string;
  payToken: TokenItem;
  receiveToken: TokenItem;
  isBestQuote?: boolean;
  bestQuoteUsd: string;
  sortIncludeGasFee: boolean;
  setSelectedBridgeQuote?: (quote: SelectedBridgeQuote) => void;
  onlyShow?: boolean;
  loading?: boolean;
  inSufficient?: boolean;
}

export const bridgeQuoteEstimatedValueBn = (
  quote: SelectedBridgeQuote,
  receiveToken: TokenItem,
  sortIncludeGasFee: boolean
) => {
  return new BigNumber(quote.to_token_amount)
    .times(receiveToken.price || 1)
    .minus(sortIncludeGasFee ? quote.gas_fee.usd_value : 0);
};

export const BridgeQuoteItem = (props: QuoteItemProps) => {
  const { t } = useTranslation();

  const openSwapQuote = useSetQuoteVisible();

  const openFeePopup = useSetSettingVisible();

  const diffPercent = React.useMemo(() => {
    if (props.onlyShow || props.isBestQuote) {
      return '';
    }

    const percent = bridgeQuoteEstimatedValueBn(
      props,
      props.receiveToken,
      props.sortIncludeGasFee
    )
      .minus(props.bestQuoteUsd)
      .div(props.bestQuoteUsd)
      .abs()
      .times(100)
      .toFixed(2, 1)
      .toString();
    return `-${percent}%`;
  }, [props]);

  const handleClick = async () => {
    if (props.inSufficient) {
      return;
    }

    props?.setSelectedBridgeQuote?.({ ...props, manualClick: true });
    openSwapQuote(false);
  };
  return (
    <Tooltip
      overlayClassName="rectangle w-[max-content]"
      placement="top"
      title={'Insufficient balance'}
      trigger={['click']}
      visible={props.inSufficient && !props.onlyShow ? undefined : false}
      align={{ offset: [0, 30] }}
      arrowPointAtCenter
    >
      <ItemWrapper
        className={clsx(
          ' flex flex-col gap-12  justify-center rounded-md',
          !props.inSufficient && 'enabledAggregator',
          props.onlyShow
            ? 'bg-transparent h-auto'
            : props.inSufficient
            ? 'h-[88px] p-16 pt-[20px] bg-transparent border-[1px] border-solid border-rabby-neutral-line'
            : clsx(
                'h-[88px] p-16 pt-[20px] cursor-pointer',
                'bg-r-neutral-card1 border-[1px] border-solid border-transparent hover:bg-rabby-blue-light1',
                ' hover:after:absolute hover:after:rounded-md hover:after:inset-[-1px] hover:after:border hover:after:border-rabby-blue-default hover:after:pointer-events-none'
              )
        )}
        style={
          props.onlyShow || props.inSufficient
            ? {}
            : {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              }
        }
        onClick={handleClick}
      >
        <div className="flex items-center justify-between relative">
          <QuoteLogo
            logo={props.aggregator.logo_url}
            bridgeLogo={props.bridge.logo_url}
            isLoading={props.onlyShow ? false : props.loading}
          />
          <div className="flex gap-6 items-center pl-6 pr-16 overflow-hidden">
            <span className="text-[16px] font-medium text-r-neutral-title1">
              {props.aggregator.name}
            </span>
            <TooltipWithMagnetArrow
              title={t('page.bridge.via-bridge', {
                bridge: props.bridge.name,
              })}
              className="rectangle w-[max-content]"
              arrowPointAtCenter
              visible={props.onlyShow ? undefined : false}
            >
              <span
                className={clsx(
                  'text-13 text-r-neutral-foot',
                  'overflow-hidden overflow-ellipsis whitespace-nowrap'
                )}
              >
                {t('page.bridge.via-bridge', {
                  bridge: props.bridge.name,
                })}
              </span>
            </TooltipWithMagnetArrow>
            {/* {props.shouldApproveToken &&  */}
            {props.shouldApproveToken && (
              <TooltipWithMagnetArrow
                overlayClassName="rectangle w-[max-content]"
                title={t('page.bridge.need-to-approve-token-before-bridge')}
                arrowPointAtCenter
                placement="top"
              >
                <img src={ImgLock} className="w-16 h16" />
              </TooltipWithMagnetArrow>
            )}
          </div>

          <div className="flex items-center gap-8 flex-1 justify-end">
            <TokenWithChain
              token={props.receiveToken}
              width="20px"
              height="20px"
              hideChainIcon
              hideConer
            />
            <span
              className={clsx(
                'text-[16px] font-medium text-rabby-neutral-title1 overflow-hidden overflow-ellipsis whitespace-nowrap',
                props.onlyShow ? 'max-w-[126px]' : 'max-w-[138px]'
              )}
              title={formatTokenAmount(props.to_token_amount)}
            >
              {formatTokenAmount(props.to_token_amount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex  items-center text-13 text-r-neutral-foot">
            <img src={ImgGas} className="w-16 h16 mr-4" />
            <span>{formatUsdValue(props.gas_fee.usd_value)}</span>
            <RCIconDuration
              viewBox="0 0 16 16"
              className="w-16 h16 ml-8 mr-4"
            />
            <span>
              {t('page.bridge.duration', {
                duration: Math.round(props.duration / 60),
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-13 text-r-neutral-foot">
            <span>
              {t('page.bridge.estimated-value', {
                value: formatUsdValue(
                  new BigNumber(props.to_token_amount)
                    .times(props.receiveToken.price)
                    .toString()
                ),
              })}
            </span>
            <RcIconInfo
              className="text-rabby-neutral-foot w-14 h-14"
              onClick={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                openFeePopup(true);
              }}
            />
          </div>
        </div>

        {!props.onlyShow && (
          <div
            className={clsx(
              'absolute top-[-1px] left-[-1px]',
              'rounded-tl-[4px] rounded-br-[4px] px-[6px] py-[1px]',
              'text-12 font-medium',
              props.isBestQuote
                ? 'text-r-green-default bg-r-green-light'
                : 'text-r-red-default bg-r-red-light'
            )}
          >
            {props.isBestQuote ? t('page.bridge.best') : diffPercent}
          </div>
        )}
      </ItemWrapper>
    </Tooltip>
  );
};
