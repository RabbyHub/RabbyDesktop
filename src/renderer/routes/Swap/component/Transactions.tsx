import styled from 'styled-components';
import RcIconPending from '@/../assets/icons/swap/pending.svg?rc';
import RcIconCompleted from '@/../assets/icons/swap/completed.svg?rc';
import { sinceTime } from '@/renderer/utils/time';
import { ellipsis } from '@/renderer/utils/address';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import {
  SwapItem,
  SwapTradeList,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconSwapArrow from '@/../assets/icons/swap/swap-arrow.svg?rc';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import BigNumber from 'bignumber.js';
import SkeletonInput from 'antd/lib/skeleton/Input';
import clsx from 'clsx';
import { Tooltip } from 'antd';
import { useInViewport, useInfiniteScroll } from 'ahooks';
import { useAtomValue } from 'jotai';
import { useAsync } from 'react-use';
import { uniqBy } from 'lodash';
import { getTokenSymbol } from '@/renderer/utils';
import { findChain } from '@/renderer/utils/chain';
import { getSwapList } from '../utils';
import {
  refreshSwapTxListAtom,
  useInSwap,
  useRefreshSwapTxList,
} from '../hooks';

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

const Wrapper = styled.div`
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
  .statusBox {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    font-weight: 400;
    font-size: 14px;
    gap: 24px;
    .status {
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ffffff;
    }
    .pending {
      color: #ffc55c;
    }

    .addr {
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .txBox {
    padding: 0 40px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    height: 108px;
    margin-bottom: 32px;
    display: flex;

    .active {
      color: #fff;
    }
  }
  .tx {
  }
`;

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
        block
        active
        style={{ minWidth: 265, width: '100%', height: 20 }}
      />
    );
  }
  return (
    <div className={clsx('flex items-center', actual && 'active')}>
      <TokenWithChain
        token={payToken}
        width="20px"
        height="20px"
        hideChainIcon
      />
      <div className="ml-12">
        {formatAmount(payTokenAmount || '0')} {getTokenSymbol(payToken)}
      </div>
      <IconSwapArrow className={clsx('text-16 mx-24')} />
      <TokenWithChain
        token={receiveToken}
        width="20px"
        height="20px"
        hideChainIcon
      />
      <div className="ml-12">
        {formatAmount(receiveTokenAmount || '0')} {getTokenSymbol(receiveToken)}
      </div>
    </div>
  );
};

const SlippageUsage = ({
  slippage,
  actual = false,
  className = '',
  loading = false,
}: {
  slippage?: number;
  actual?: boolean;
  className?: string;
  loading?: boolean;
}) => {
  const value = useMemo(
    () =>
      slippage !== undefined
        ? `${new BigNumber(slippage).times(100).toString(10)}%`
        : '',
    [slippage]
  );
  return (
    <div
      className={clsx(
        'flex flex-col justify-center items-center gap-12 ml-auto text-white text-opacity-60',
        className
      )}
    >
      <div
        className={clsx(
          'text-20  font-medium',
          actual && 'text-white text-opacity-100'
        )}
      >
        {!loading ? (
          value
        ) : (
          <SkeletonInput active style={{ height: 24, minWidth: 60 }} />
        )}
      </div>
      <div className="text-14">
        {actual ? 'Actual Slippage' : 'Slippage tolerance'}
      </div>
    </div>
  );
};

interface TransactionProps {
  data: SwapTradeList['history_list'][number];
}
const Transaction = forwardRef<HTMLDivElement, TransactionProps>(
  ({ data }, ref) => {
    const isPending = data.status === 'Pending';
    const isCompleted = data?.status === 'Completed';
    const time = data?.finished_at || data?.create_at;
    const targetDex = data?.dex_id;
    const txId = data?.tx_id;
    const chainItem = findChain({
      serverId: data?.chain,
    });
    const chainName = chainItem?.name || '';
    const scanLink = chainItem?.scanLink.replace('_s_', '');
    const loading = data?.status !== 'Finished';

    const gasUsed = useMemo(() => {
      if (data?.gas) {
        return `${formatAmount(data.gas.native_gas_fee)} ${getTokenSymbol(
          data?.gas.native_token
        )} (${formatUsdValue(data.gas.usd_gas_fee)})`;
      }
      return '';
    }, [data?.gas]);

    const gotoScan = () => {
      if (scanLink && txId) {
        openExternalUrl(scanLink + txId);
      }
    };

    return (
      <div className="tx" ref={ref}>
        <div className="statusBox">
          {isPending && (
            <Tooltip title="Tx submitted. If the tx is pending for long hours, you can try to clear pending in settings.">
              <div className="status">
                <RcIconPending className="text-16 animate-spin mr-6" />
                <span className="pending">Pending</span>
              </div>
            </Tooltip>
          )}
          {isCompleted && (
            <Tooltip title="Transaction on chain, decoding data to generate record">
              <div className="status">
                <RcIconCompleted className="text-16 mr-6" />
                <span>Completed</span>
              </div>
            </Tooltip>
          )}
          <span>{!isPending && sinceTime(time)}</span>
          {!!targetDex && <span>Aggregator: {targetDex}</span>}

          {!loading ? (
            <span className="ml-auto">GasFee: {gasUsed}</span>
          ) : (
            <span className="ml-auto">
              Gas price: {data?.gas?.gas_price} Gwei
            </span>
          )}
          <span>
            {chainName}:{' '}
            <span className="addr" onClick={gotoScan}>
              {ellipsis(txId)}
            </span>
          </span>
        </div>
        <div className="txBox flex">
          <div className="flex flex-col justify-center gap-20">
            <div> Estimate</div>
            <div> Actual</div>
          </div>
          <div className="flex flex-col justify-center gap-20 ml-[62px]">
            <TokenCost
              payToken={data?.pay_token}
              receiveToken={data.receive_token}
              payTokenAmount={data.quote.pay_token_amount}
              receiveTokenAmount={data.quote.receive_token_amount}
            />

            <TokenCost
              payToken={data?.pay_token}
              receiveToken={data.receive_token}
              payTokenAmount={data.actual.pay_token_amount}
              receiveTokenAmount={data.actual.receive_token_amount}
              loading={loading}
              actual
            />
          </div>

          <SlippageUsage slippage={data.quote.slippage} />
          <SlippageUsage
            slippage={data.actual.slippage}
            actual
            className="ml-[56px]"
            loading={loading}
          />
        </div>
      </div>
    );
  }
);

const TxLoading = () => {
  return (
    <>
      <div className="txBox flex-col gap-20 justify-center">
        <SkeletonInput active block />
        <SkeletonInput active block />
      </div>
      <div className="txBox flex-col gap-20 justify-center">
        <SkeletonInput active block />
        <SkeletonInput active block />
      </div>
      <div className="txBox flex-col gap-20 justify-center">
        <SkeletonInput active block />
        <SkeletonInput active block />
      </div>
    </>
  );
};

interface SwapTransactionsProps {
  addr: string;
}
export const SwapTransactions = memo(({ addr }: SwapTransactionsProps) => {
  const refreshSwapListTx = useRefreshSwapTxList();
  const refreshSwapTxListCount = useAtomValue(refreshSwapTxListAtom);
  const isInSwap = useInSwap();

  const {
    data: txList,
    loading,
    loadMore,
    loadingMore,
    noMore,
    mutate,
  } = useInfiniteScroll(
    (d) =>
      getSwapList(
        addr,
        d?.list?.length && d?.list?.length > 1 ? d?.list?.length - 1 : 0,
        5
      ),
    {
      reloadDeps: [isInSwap],
      isNoMore(data) {
        if (data) {
          return data?.list.length >= data?.totalCount;
        }
        return true;
      },
      manual: !isInSwap || !addr,
    }
  );

  const { value } = useAsync(async () => {
    if (addr) {
      return getSwapList(addr, 0, 5);
    }
  }, [addr, refreshSwapTxListCount]);

  useEffect(() => {
    if (value?.list) {
      mutate((d) => {
        if (!d) {
          return;
        }
        return {
          last: d?.last,
          totalCount: d?.totalCount,
          list: uniqBy(
            [...(value.list || []), ...(d?.list || [])],
            (e) => `${e.chain}-${e.tx_id}`
          ) as SwapItem[],
        };
      });
    }
  }, [mutate, value]);

  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (!noMore && inViewport && !loadingMore && loadMore && isInSwap) {
      loadMore();
    }
  }, [inViewport, loadMore, loading, loadingMore, noMore, isInSwap]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      !loading &&
      !loadingMore &&
      txList?.list?.some((e) => e.status !== 'Finished') &&
      isInSwap
    ) {
      timer = setTimeout(refreshSwapListTx, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingMore, refreshSwapListTx, txList?.list, isInSwap]);

  return (
    <Wrapper>
      <div className="title">Swap Transactions </div>
      {!loading && (!txList || !txList?.list?.length) && <Empty />}
      {txList?.list?.map((swap, idx) => (
        <Transaction
          ref={txList?.list.length - 1 === idx ? ref : undefined}
          key={`${swap.tx_id}-${swap.chain}`}
          data={swap}
        />
      ))}
      {((loading && !txList) || loadingMore) && <TxLoading />}
    </Wrapper>
  );
});
