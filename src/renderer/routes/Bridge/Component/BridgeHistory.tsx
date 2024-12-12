import React, { forwardRef, useMemo } from 'react';
import styled from 'styled-components';

import { BridgeHistory, TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import ImgPending from '@/../assets/icons/swap/pending.svg';

import RcIconSwapArrow from '@/../assets/icons/swap/arrow-right.svg?rc';

import clsx from 'clsx';
import SkeletonInput from 'antd/lib/skeleton/Input';
import { useTranslation } from 'react-i18next';
import { findChain } from '@/renderer/utils/chain';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import { getTokenSymbol } from '@/renderer/utils';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import { sinceTime } from '@/renderer/utils/time';
import { ellipsis } from '@/renderer/utils/address';
import { useBridgeHistory } from '../hooks';

const BridgeTokenIcon = (props: { token: TokenItem }) => {
  const { token } = props;
  const chain = React.useMemo(() => {
    const chainServerId = token.chain;
    return findChain({
      serverId: chainServerId,
    });
  }, [token]);

  return (
    <div className="w-20 h-20 relative">
      <img className="w-20 h-20" src={token.logo_url} />
      <img
        className="w-12 h-12 absolute -right-4 -bottom-4"
        src={chain?.logo}
      />
    </div>
  );
};

const TokenCost = ({
  payToken,
  receiveToken,
  payTokenAmount,
  receiveTokenAmount,
  loading = false,
  actual = false,
}: {
  payToken: TokenItem;
  receiveToken: TokenItem;
  payTokenAmount?: number;
  receiveTokenAmount?: number;
  loading?: boolean;
  actual?: boolean;
}) => {
  if (loading) {
    return (
      <SkeletonInput
        active
        style={{ minWidth: 220, width: '100%', height: 16 }}
      />
    );
  }
  return (
    <div
      className={clsx(
        'flex items-center text-13 text-r-neutral-title-1',
        !actual && 'opacity-70'
      )}
    >
      <BridgeTokenIcon token={payToken} />
      <div className="ml-8">
        {formatAmount(payTokenAmount || '0')} {getTokenSymbol(payToken)}
      </div>
      <RcIconSwapArrow className={clsx('w-[16px] h-[16px] mx-24')} />
      <BridgeTokenIcon token={receiveToken} />
      <div className="ml-8">
        {formatAmount(receiveTokenAmount || '0')} {getTokenSymbol(receiveToken)}
      </div>
    </div>
  );
};

interface TransactionProps {
  data: BridgeHistory;
}
const Transaction = forwardRef<HTMLDivElement, TransactionProps>(
  ({ data }, ref) => {
    const isPending = data.status === 'pending';
    const isCompleted = data?.status === 'completed';
    const time =
      // data?.finished_at ||
      data?.create_at;

    const txId = data?.detail_url?.split('/').pop() || '';

    const loading = data?.status !== 'completed';

    const gasUsed = useMemo(() => {
      if (data?.from_gas) {
        return `${formatAmount(data.from_gas.gas_amount)} ${getTokenSymbol(
          data?.from_gas.native_token
        )} (${formatUsdValue(data.from_gas.usd_gas_fee)})`;
      }
      return '';
    }, [data?.from_gas]);

    const gotoScan = React.useCallback(() => {
      if (data?.detail_url) {
        // openInTab(data?.detail_url);
        openExternalUrl(data?.detail_url);
      }
    }, [data?.detail_url]);

    const { t } = useTranslation();

    return (
      <div
        className={clsx(
          ' rounded-[6px] p-12 relative text-12 text-r-neutral-body'
        )}
        ref={ref}
      >
        <div className="flex items-center pb-8 border- gap-12">
          <div className="flex items-center text-12 font-medium text-r-neutral-title-1">
            {isPending && (
              <TooltipWithMagnetArrow title={t('page.bridge.pendingTip')}>
                <div className="flex items-center">
                  <img
                    src={ImgPending}
                    alt="loading"
                    className="w-[14px] h-[14px] animate-spin mr-6"
                  />
                  <span className="text-orange">
                    {t('page.bridge.Pending')}
                  </span>
                </div>
              </TooltipWithMagnetArrow>
            )}

            <span className="whitespace-nowrap">
              {!isPending && sinceTime(time)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* <img
              src={data.aggregator.logo_url}
              className="w-16 h-16 rounded-full"
            /> */}
            <span className="text-13 font-medium text-r-neutral-body rounded-full">
              Aggregator: {data.aggregator.name}
            </span>
            <span
              className="truncate"
              title={t('page.bridge.via-bridge', {
                bridge: data?.bridge?.name || '',
              })}
            >
              {t('page.bridge.via-bridge', {
                bridge: data?.bridge?.name || '',
              })}
            </span>
          </div>

          {!loading ? (
            <span className="ml-auto">
              {t('page.bridge.gas-fee', { gasUsed })}
            </span>
          ) : (
            <span className="ml-auto">
              {t('page.bridge.gas-x-price', {
                price: data?.from_gas?.gas_price || '',
              })}
            </span>
          )}

          <div className="flex items-center text-12 text-r-neutral-body">
            <span className="cursor-pointer" onClick={gotoScan}>
              {t('page.bridge.detail-tx')}:{' '}
              <span className="underline underline-r-neutral-foot">
                {txId ? ellipsis(txId) : ''}
              </span>
            </span>
          </div>
        </div>

        <div
          style={{
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.20)',
          }}
          className="h-[108px] flex flex-col px-32 py-24 justify-between"
        >
          <div className="flex items-center">
            <span className="w-[80px]">{t('page.bridge.estimate')}</span>
            <div>
              <TokenCost
                payToken={data?.from_token}
                receiveToken={data.to_token}
                payTokenAmount={data.quote.pay_token_amount}
                receiveTokenAmount={data.quote.receive_token_amount}
              />
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-[80px]">{t('page.bridge.actual')}</span>
            <div>
              <TokenCost
                payToken={data?.from_token}
                receiveToken={data.to_token}
                payTokenAmount={data.actual.pay_token_amount}
                receiveTokenAmount={data.actual.receive_token_amount}
                loading={loading}
                actual
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  height: 260px;

  .empty-img {
    width: 78px;
    height: 84px;
  }
  .desc {
    color: rgba(255, 255, 255, 0.4);
    font-size: 13px;
  }
`;
const Empty = () => {
  return (
    <EmptyWrapper>
      <img
        src="rabby-internal://assets/icons/home/tx-empty.png"
        className="empty-img"
      />
      <div className="desc">No Transactions records</div>
    </EmptyWrapper>
  );
};

const HistoryList = () => {
  const { txList, loading, loadingMore, ref } = useBridgeHistory();

  if (!loading && (!txList || !txList?.list?.length)) {
    return <Empty />;
  }

  return (
    <div className="space-y-[12px] pb-20">
      {txList?.list
        ?.sort((a, b) => {
          let aIndex = 0;
          let bIndex = 0;
          if (a.status === 'pending') {
            aIndex = 1;
          }
          if (b.status === 'pending') {
            bIndex = 1;
          }
          return bIndex - aIndex;
        })
        ?.map((item, idx) => (
          <Transaction
            ref={txList?.list.length - 1 === idx ? ref : undefined}
            key={`${item.detail_url}-${item.create_at}`}
            data={item}
          />
        ))}
      {((loading && !txList) || loadingMore) && (
        <>
          <SkeletonInput className="w-full h-[168px] rounded-[6px]" active />
          <SkeletonInput className="w-full h-[168px] rounded-[6px]" active />
        </>
      )}
    </div>
  );
};

const Wrapper = styled.div`
  --max-swap-width: 1080px;
  color: rgba(255, 255, 255, 0.6);
  width: var(--max-swap-width);
  margin: 0 auto;
  margin-top: 40px;
  margin-bottom: 100px;

  .title {
    color: white;
    font-size: 20px;
    font-weight: medium;
    margin-bottom: 20px;
  }
  .list-box {
    min-height: 260px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

export const BridgeTxHistory = () => {
  return (
    <Wrapper>
      <div className="title">Bridge Transactions</div>
      <HistoryList />
    </Wrapper>
  );
};
