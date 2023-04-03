import styled from 'styled-components';
import RcIconPending from '@/../assets/icons/swap/pending.svg?rc';
import RcIconCompleted from '@/../assets/icons/swap/completed.svg?rc';
import { sinceTime } from '@/renderer/utils/time';
import { ellipsis } from '@/renderer/utils/address';
import { CHAINS_LIST } from '@debank/common';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import { SwapTradeList, TokenItem } from '@debank/rabby-api/dist/types';
import TokenWithChain from '@/renderer/components/TokenWithChain';
import IconSwapArrow from '@/../assets/icons/swap/swap-arrow.svg?rc';
import { formatAmount, formatUsdValue } from '@/renderer/utils/number';
import BigNumber from 'bignumber.js';
import SkeletonInput from 'antd/lib/skeleton/Input';
import clsx from 'clsx';
import { Tooltip } from 'antd';
import { useInViewport, useInfiniteScroll } from 'ahooks';
import { useAtomValue } from 'jotai';
import { getSwapList } from '../utils';
import { refreshSwapTxListAtom, useRefreshSwapTxList } from '../hooks';

const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  height: 260px;

  .empty-img {
    width: 78px;
    height: 84px;
  }
  .desc {
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    line-height: 21px;

    color: #ffffff;
  }
`;
const Empty = () => {
  return (
    <EmptyWrapper>
      <img
        src="rabby-internal://assets/icons/home/tx-empty.png"
        className="empty-img"
      />
      <div className="desc">No Transactions</div>
    </EmptyWrapper>
  );
};

const Wrapper = styled.div`
  color: rgba(255, 255, 255, 0.6);
  width: 1080px;
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
    }
  }

  .txBox {
    padding: 0 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    height: 108px;
    margin-bottom: 32px;
    display: flex;
  }
  .tx {
  }
`;

const TokenCost = ({
  payToken,
  receiveToken,
  payTokenAmount,
  receiveTokenAmount,
}: {
  payToken: TokenItem;
  receiveToken: TokenItem;
  payTokenAmount?: number;
  receiveTokenAmount?: number;
}) => {
  if (!payTokenAmount || !receiveTokenAmount) {
    return (
      <SkeletonInput
        block
        active
        style={{ minWidth: 265, width: '100%', height: 20 }}
      />
    );
  }
  return (
    <div className="flex items-center">
      <TokenWithChain
        token={payToken}
        width="20px"
        height="20px"
        hideChainIcon
      />
      <div className="ml-12">
        {formatAmount(payTokenAmount)} {payToken.symbol}
      </div>
      <IconSwapArrow className="text-16 mx-24" />
      <TokenWithChain
        token={receiveToken}
        width="20px"
        height="20px"
        hideChainIcon
      />
      <div className="ml-12">
        {formatAmount(receiveTokenAmount)} {receiveToken.symbol}
      </div>
    </div>
  );
};

const SlippageUsage = ({
  slippage,
  actual = false,
  className = '',
}: {
  slippage?: number;
  actual?: boolean;
  className?: string;
}) => {
  const value = useMemo(
    () =>
      slippage ? `${new BigNumber(slippage).times(100).toString(10)}%` : '',
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
        className={clsx('text-20 font-medium', actual && 'text-opacity-100')}
      >
        {slippage ? (
          value
        ) : (
          <SkeletonInput active style={{ height: 24, minWidth: 60 }} />
        )}
      </div>
      <div className="text-14"> Designated Slippage</div>
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
    const chainItem = CHAINS_LIST.find((e) => e.serverId === data?.chain);
    const chainName = chainItem?.name || '';
    const scanLink = chainItem?.scanLink.replace('_s_', '');

    const gasUsed = useMemo(() => {
      if (data?.gas) {
        const amount = new BigNumber(data.gas.usd_gas_fee).div(
          10 ** data?.gas.native_token.decimals
        );

        const usdValue = amount.times(data?.gas.native_token?.price);

        return `${formatAmount(amount.toString(10))} ${
          data?.gas.native_token.symbol
        } (${formatUsdValue(usdValue.toString(10))})`;
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
          <span>Aggregator: {targetDex}</span>

          {gasUsed ? <span className="ml-auto">GasFee: {gasUsed}</span> : null}
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
            />
          </div>

          <SlippageUsage slippage={data.quote.slippage} />
          <SlippageUsage
            slippage={data.actual.slippage}
            actual
            className="ml-[56px]"
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

  const {
    data: txList,
    loading,
    loadMore,
    loadingMore,
    noMore,
  } = useInfiniteScroll((d) => getSwapList(addr, d?.list?.length || 0), {
    reloadDeps: [refreshSwapTxListCount],
    isNoMore(data) {
      if (data) {
        return data?.list.length <= data?.last.total_cnt;
      }
      return true;
    },
  });

  const ref = useRef<HTMLDivElement>(null);

  const [inViewport] = useInViewport(ref);

  useEffect(() => {
    if (!noMore && inViewport && !loadingMore && loadMore) {
      loadMore();
    }
  }, [inViewport, loadMore, loading, loadingMore, noMore]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      !loading &&
      !loadingMore &&
      txList?.list?.some((e) => e.status !== 'Finished')
    ) {
      timer = setTimeout(refreshSwapListTx, 2000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingMore, refreshSwapListTx, txList?.list]);

  return (
    <Wrapper>
      <div className="title">Swap Transactions </div>
      {!loading && (!txList || !txList?.list?.length) && <Empty />}
      {txList?.list?.map((swap, idx) => (
        <Transaction
          ref={
            txList?.list.length > 4 && idx === txList?.list.length - 2
              ? ref
              : undefined
          }
          key={`${swap.tx_id}-${swap.chain}`}
          data={swap}
        />
      ))}
      {((loading && !txList) || loadingMore) && <TxLoading />}
    </Wrapper>
  );
});
