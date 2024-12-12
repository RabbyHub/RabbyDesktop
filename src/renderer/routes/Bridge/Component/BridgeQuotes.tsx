import React, { useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import { Drawer } from 'antd';
import styled from 'styled-components';

import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import RCIconCCEmpty from '@/../assets/icons/bridge/empty-cc.svg?rc';
import SvgIconCross from '@/../assets/icons/modal/close.svg?rc';
import { useTranslation } from 'react-i18next';
import Popup from '@/renderer/components/Popup';
import { Checkbox } from '@/renderer/components/Checkbox';
import { QuoteLoading } from './loading';
import { IconRefresh } from './IconRefresh';
import { SelectedBridgeQuote, useSetRefreshId } from '../hooks';
import { BridgeQuoteItem } from './BridgeQuoteItem';

interface QuotesProps {
  userAddress: string;
  loading: boolean;
  inSufficient: boolean;
  payToken: TokenItem;
  receiveToken: TokenItem;
  list?: SelectedBridgeQuote[];
  activeName?: string;
  visible: boolean;
  onClose: () => void;
  payAmount: string;
  setSelectedBridgeQuote: (quote?: SelectedBridgeQuote) => void;
  sortIncludeGasFee: boolean;
}

export const Quotes = ({
  list,
  activeName,
  inSufficient,
  sortIncludeGasFee,
  ...other
}: QuotesProps) => {
  const { t } = useTranslation();

  const sortedList = useMemo(() => {
    return list?.sort((b, a) => {
      return new BigNumber(a.to_token_amount)
        .times(other.receiveToken.price || 1)
        .minus(sortIncludeGasFee ? a.gas_fee.usd_value : 0)
        .minus(
          new BigNumber(b.to_token_amount)
            .times(other.receiveToken.price || 1)
            .minus(sortIncludeGasFee ? b.gas_fee.usd_value : 0)
        )
        .toNumber();
    });
  }, [list, sortIncludeGasFee, other.receiveToken]);

  const bestQuoteUsd = useMemo(() => {
    const bestQuote = sortedList?.[0];
    if (!bestQuote) {
      return '0';
    }
    return new BigNumber(bestQuote.to_token_amount)
      .times(other.receiveToken.price || 1)
      .minus(sortIncludeGasFee ? bestQuote.gas_fee.usd_value : 0)
      .toString();
  }, [sortedList, other.receiveToken, sortIncludeGasFee]);

  return (
    <div className="flex flex-col h-full w-full ">
      <div className="flex flex-col gap-12 flex-1 pb-12">
        {sortedList?.map((item, idx) => {
          return (
            <BridgeQuoteItem
              key={item.aggregator.id + item.bridge_id}
              {...item}
              sortIncludeGasFee={!!sortIncludeGasFee}
              isBestQuote={idx === 0}
              bestQuoteUsd={bestQuoteUsd}
              payToken={other.payToken}
              receiveToken={other.receiveToken}
              setSelectedBridgeQuote={other.setSelectedBridgeQuote}
              payAmount={other.payAmount}
              inSufficient={inSufficient}
            />
          );
        })}
        {other.loading &&
          !sortedList?.length &&
          Array.from({ length: 4 }).map((_, idx) => <QuoteLoading />)}

        {!other.loading && !sortedList?.length && (
          <div className="h-full flex flex-col justify-center items-center gap-12 mb-20">
            <RCIconCCEmpty className="w-40 h-40 text-rabby-neutral-foot" />
            <span className="text-14 text-r-neutral-foot">
              {t('page.bridge.no-route-found')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const StyledDrawer = styled(Drawer)`
  .ant-drawer-content {
    background: transparent;
    max-height: 640px;
  }
  .ant-drawer-body {
    padding: 20px;
    border-radius: 16px;
    background: var(--r-neutral-bg2, #3d4251);
    box-shadow: 0px -12px 20px 0px rgba(35, 47, 129, 0.1);
    overflow: hidden;
  }
  .ant-drawer-mask {
    position: fixed;
    background: rgba(0, 0, 0, 0.5);
  }
`;

export const QuoteList = (props: Omit<QuotesProps, 'sortIncludeGasFee'>) => {
  const { visible, onClose } = props;
  const refresh = useSetRefreshId();

  const refreshQuote = React.useCallback(() => {
    refresh((e) => e + 1);
  }, [refresh]);

  const { t } = useTranslation();

  const [sortIncludeGasFee, setSortIncludeGasFee] = useState(true);

  useEffect(() => {
    if (!visible) {
      setSortIncludeGasFee(true);
    }
  }, [visible]);

  return (
    <StyledDrawer
      placement="bottom"
      getContainer={false}
      width={528}
      height="auto"
      maskClosable
      onClose={onClose}
      open={visible}
      closable={false}
      destroyOnClose
    >
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6 text-left text-r-neutral-title-1 text-[16px] font-medium ">
          <div>{t('page.bridge.the-following-bridge-route-are-found')}</div>
          <div className="w-[26px] h-[26px]">
            <IconRefresh onClick={refreshQuote} />
          </div>
        </div>

        <Checkbox
          checked={!!sortIncludeGasFee}
          onChange={setSortIncludeGasFee}
          className="text-14 font-medium text-rabby-neutral-body"
          width="14px"
          height="14px"
          type="square"
          background="transparent"
          unCheckBackground="transparent"
          checkIcon={
            sortIncludeGasFee ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  fill="var(--r-blue-default)"
                  d="M12.103.875H1.898a1.02 1.02 0 0 0-1.02 1.02V12.1c0 .564.456 1.02 1.02 1.02h10.205a1.02 1.02 0 0 0 1.02-1.02V1.895a1.02 1.02 0 0 0-1.02-1.02Z"
                />
                <path
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.05}
                  d="m4.2 7.348 2.1 2.45 4.2-4.9"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="var(--r-neutral-foot)"
                  strokeLinejoin="round"
                  strokeWidth={0.75}
                  d="M12.103.875H1.898a1.02 1.02 0 0 0-1.02 1.02V12.1c0 .564.456 1.02 1.02 1.02h10.205a1.02 1.02 0 0 0 1.02-1.02V1.895a1.02 1.02 0 0 0-1.02-1.02Z"
                />
              </svg>
            )
          }
        >
          <span className="ml-[-4px] text-r-neutral-body text-14 font-medium">
            {t('page.swap.sort-with-gas')}
          </span>
        </Checkbox>
      </div>
      <Quotes {...props} sortIncludeGasFee={sortIncludeGasFee} />
    </StyledDrawer>
  );
};
