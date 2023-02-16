import { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { maxBy, minBy, sortBy } from 'lodash';
import { useInterval } from 'react-use';
import { useNavigate } from 'react-router-dom';
import {
  TokenItem,
  TransferingNFTItem,
  TxHistoryResult,
} from '@debank/rabby-api/dist/types';
import { CHAINS } from '@debank/common';
import type {
  TransactionDataItem,
  TransactionGroup,
} from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
// eslint-disable-next-line import/no-cycle
import TransactionItem, { LoadingTransactionItem } from './TransactionItem';

const TransactionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-height: calc(100% - 154px);
`;

const TransactionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  flex: 1;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmptyView = styled.div`
  height: 155px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  p {
    margin-top: 8px;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.4);
  }
  .icon-empty {
    width: 52px;
  }
`;

const ViewAllButton = styled.div`
  cursor: pointer;
  text-align: center;
  font-size: 12px;
  line-height: 40px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.02);
  border-bottom-right-radius: 6px;
  border-bottom-left-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-width: 0;
`;

const formatToken = (i: TokenItem | TransferingNFTItem, isReceive: boolean) => {
  const token: {
    tokenId: string;
    token: TokenItem | undefined;
    amount: number;
  } = {
    tokenId: i.id,
    token: {
      content_type: i.content_type,
      content: i.content,
      inner_id: i.inner_id,
      amount: i.amount,
      chain: i.chain,
      decimals: (i as unknown as TokenItem).decimals || 0,
      display_symbol: (i as unknown as TokenItem).display_symbol || '',
      id: i.id,
      is_core: (i as unknown as TokenItem).is_core || false,
      is_verified: (i as unknown as TokenItem).is_verified || false,
      is_wallet: (i as unknown as TokenItem).is_wallet || false,
      logo_url: (i as unknown as TokenItem).logo_url || '',
      name: i.name,
      optimized_symbol: (i as unknown as TokenItem).optimized_symbol || '',
      price: (i as unknown as TokenItem).price || 0,
      symbol: (i as unknown as TokenItem).symbol || '',
      time_at: (i as unknown as TokenItem).price || 0,
    },
    amount: i.amount,
  };
  if (!isReceive) {
    return {
      ...token,
      from: '',
    };
  }
  return {
    ...token,
    to: '',
  };
};

const getTxInfoFromExplain = (explain: TransactionGroup['explain']) => {
  let type = '';
  let protocol: TransactionDataItem['protocol'] = null;
  let name = '';
  if (explain.type_cancel_tx) {
    type = 'cancel';
  } else if (
    explain.type_cancel_token_approval ||
    explain.type_token_approval
  ) {
    type = 'approve';
  } else if (explain.type_nft_send || explain.type_send) {
    type = 'send';
  } else {
    type = '';
  }
  if (explain.type_call && explain.type_call.contract_protocol_name) {
    protocol = {
      name: explain.type_call.contract_protocol_name,
      logoUrl: explain.type_call.contract_protocol_logo_url,
    };
    name = explain.type_call.action;
  } else if (
    explain.type_token_approval &&
    explain.type_token_approval.spender_protocol_name
  ) {
    protocol = {
      name: explain.type_token_approval.spender_protocol_name,
      logoUrl: explain.type_token_approval.spender_protocol_logo_url,
    };
  }
  return {
    type,
    protocol,
    name,
  };
};

const Empty = ({ text }: { text: string }) => (
  <EmptyView>
    <img
      src="rabby-internal://assets/icons/home/tx-empty.png"
      className="icon-empty"
    />
    <p>{text}</p>
  </EmptyView>
);

const Transactions = () => {
  const { currentAccount } = useCurrentAccount();
  const [recentTxs, setRecentTxs] = useState<TransactionDataItem[]>([]);
  const [remoteTxs, setRemoteTxs] = useState<TxHistoryResult['history_list']>(
    []
  );
  const [pendingTxs, setPendingTxs] = useState<TransactionDataItem[]>([]);
  const [localTxs, setLocalTxs] = useState<TransactionDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const completedTxs = useMemo(() => {
    return localTxs.filter(
      (item) =>
        !recentTxs.find((i) => item.id === i.id && item.chain === i.chain)
    );
  }, [recentTxs, localTxs]);

  const mergedRecentTxs = useMemo(() => {
    return sortBy(
      [
        ...recentTxs.slice(0, 3).map((item) => {
          return {
            ...item,
            origin: localTxs.find(
              (i) => i.id === item.id && i.chain === item.chain
            )?.origin,
          };
        }),
        ...completedTxs,
      ],
      'timeAt'
    ).reverse();
  }, [recentTxs, completedTxs, localTxs]);

  console.log(completedTxs, pendingTxs, localTxs, mergedRecentTxs);

  const initLocalTxs = useCallback(async () => {
    if (!currentAccount?.address) return;
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const { pendings, completeds } =
      await walletController.getTransactionHistory(currentAccount.address);
    const lTxs: TransactionDataItem[] = [];
    const pTxs: TransactionDataItem[] = [];
    completeds
      .filter(
        (item) => item.createdAt >= YESTERDAY * 1000 && !item.isSubmitFailed
      )
      .forEach((item) => {
        const chain = Object.values(CHAINS).find((i) => i.id === item.chainId);
        if (!chain) return;
        const maxTx = maxBy(
          item.txs,
          (i) => Number(i.rawTx.gasPrice) || Number(i.rawTx.maxFeePerGas)
        )!;
        const completedTx = item.txs.find((tx) => tx.isCompleted);
        const { type, protocol, name } = getTxInfoFromExplain(item.explain);
        const balanceChange = item.explain.balance_change;
        lTxs.push({
          type,
          receives: [
            ...balanceChange.receive_nft_list,
            ...balanceChange.receive_token_list,
          ].map(
            (i) =>
              formatToken(i, true) as {
                tokenId: string;
                from: string;
                token: TokenItem | undefined;
                amount: number;
              }
          ),
          sends: [
            ...balanceChange.send_nft_list,
            ...balanceChange.send_token_list,
          ].map(
            (i) =>
              formatToken(i, false) as {
                tokenId: string;
                to: string;
                token: TokenItem | undefined;
                amount: number;
              }
          ),
          protocol,
          id: maxTx!.hash,
          chain: chain.serverId,
          status: 'completed',
          otherAddr: maxTx.rawTx.to || '',
          name,
          timeAt: item.createdAt,
          origin: completedTx?.site?.origin,
        });
      });
    setLocalTxs(lTxs);
    pendings
      .filter(
        (item) => item.createdAt >= YESTERDAY * 1000 && !item.isSubmitFailed
      )
      .forEach((item) => {
        const chain = Object.values(CHAINS).find((i) => i.id === item.chainId);
        if (!chain) return;
        const maxTx = maxBy(
          item.txs,
          (i) => i.rawTx.gasPrice || i.rawTx.maxFeePerGas
        )!;
        const originTx = minBy(item.txs, (tx) => tx.createdAt);
        const { type, protocol, name } = getTxInfoFromExplain(item.explain);
        const balanceChange = item.explain.balance_change;
        pTxs.push({
          type,
          receives: [
            ...balanceChange.receive_nft_list,
            ...balanceChange.receive_token_list,
          ].map(
            (i) =>
              formatToken(i, true) as {
                tokenId: string;
                from: string;
                token: TokenItem | undefined;
                amount: number;
              }
          ),
          sends: [
            ...balanceChange.send_nft_list,
            ...balanceChange.send_token_list,
          ].map(
            (i) =>
              formatToken(i, false) as {
                tokenId: string;
                to: string;
                token: TokenItem | undefined;
                amount: number;
              }
          ),
          protocol,
          id: maxTx!.hash,
          chain: chain.serverId,
          status: 'pending',
          otherAddr: maxTx.rawTx.to || '',
          name,
          timeAt: item.createdAt,
          rawTx: maxTx.rawTx,
          origin: originTx?.site?.origin,
          txs: item.txs,
        });
      });
    setPendingTxs(pTxs);
  }, [currentAccount]);

  const init = async () => {
    if (!currentAccount) return;
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const txs = await walletOpenapi.listTxHisotry({
      id: currentAccount.address,
    });
    setRemoteTxs(txs.history_list || []);
    const recent = txs.history_list.filter((item) => item.time_at >= YESTERDAY);
    const dbTxs = recent.map((item) => {
      const data: TransactionDataItem = {
        type: item.cate_id,
        receives: item.receives.map((i) => ({
          tokenId: i.token_id,
          from: i.from_addr,
          token: txs.token_dict[i.token_id],
          amount: i.amount,
        })),
        sends: item.sends.map((i) => ({
          tokenId: i.token_id,
          to: i.to_addr,
          token: txs.token_dict[i.token_id],
          amount: i.amount,
        })),
        id: item.id,
        chain: item.chain,
        protocol:
          item.project_id && txs.project_dict[item.project_id]
            ? {
                name: txs.project_dict[item.project_id].name,
                logoUrl: txs.project_dict[item.project_id].logo_url,
              }
            : null,
        status: 'finish',
        otherAddr: item.other_addr,
        name: item.tx?.name,
        timeAt: item.time_at * 1000,
      };
      if (item.tx?.status === 0) {
        data.status = 'failed';
      }
      if (item.cate_id === 'approve' && item.token_approve) {
        data.approve = {
          token_id: item.token_approve.token_id,
          value: item.token_approve.value,
          spender: item.token_approve.spender,
          token: txs.token_dict[item.token_approve.token_id],
        };
      }
      return data;
    });
    initLocalTxs();
    setRecentTxs(sortBy(dbTxs, 'timeAt').reverse());
    setIsLoading(false);
  };

  useInterval(
    init,
    pendingTxs.length > 0 || completedTxs.length > 0 ? 5000 : 60 * 1000
  );

  useEffect(() => {
    setIsLoading(true);
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event !== 'transactionChanged') return;
        switch (payload.data?.type) {
          default:
            break;
          case 'submitted': {
            initLocalTxs();
            break;
          }
          case 'finished': {
            initLocalTxs();
            break;
          }
        }
      }
    );
  }, [initLocalTxs]);

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <TransactionWrapper>
        <TransactionList>
          <LoadingTransactionItem />
          <LoadingTransactionItem />
          <LoadingTransactionItem />
        </TransactionList>
      </TransactionWrapper>
    );
  }

  if (pendingTxs.length <= 0 && mergedRecentTxs.length <= 0) {
    return (
      <TransactionWrapper>
        <TransactionList>
          <Empty
            text={
              remoteTxs.length > 0
                ? 'No transaction in last 24 hours'
                : 'No transaction'
            }
          />
        </TransactionList>
        {remoteTxs.length > 0 && (
          <ViewAllButton
            onClick={() => {
              navigate('/mainwin/home/transactions');
            }}
          >
            View All Transactions
          </ViewAllButton>
        )}
      </TransactionWrapper>
    );
  }

  return (
    <TransactionWrapper>
      <TransactionList>
        {pendingTxs.map((tx) => {
          return <TransactionItem item={tx} key={`${tx.chain}-${tx.id}`} />;
        })}
        {mergedRecentTxs.map((tx) => {
          return <TransactionItem item={tx} key={`${tx.chain}-${tx.id}`} />;
        })}
        {pendingTxs.length + mergedRecentTxs.length < 3 && (
          <Empty text="No more transaction in last 24 hours" />
        )}
      </TransactionList>
      <ViewAllButton
        onClick={() => {
          navigate('/mainwin/home/transactions');
        }}
      >
        View All Transactions
      </ViewAllButton>
    </TransactionWrapper>
  );
};

export default Transactions;
