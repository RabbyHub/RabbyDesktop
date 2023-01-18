import { useEffect, useState, useCallback } from 'react';
import { TokenItem, TransferingNFTItem } from '@debank/rabby-api/dist/types';
import { CHAINS } from '@debank/common';
import styled from 'styled-components';
import { maxBy, sortBy } from 'lodash';
import { TransactionGroup } from '@/isomorphic/types-rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
// eslint-disable-next-line import/no-cycle
import TransactionItem from './TransactionItem';

const TransactionWrapper = styled.div``;

const Title = styled.p`
  margin-bottom: 20px;
  font-weight: 500;
  font-size: 15px;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.4);
`;

const TransactionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
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

export interface TransactionDataItem {
  type: string | null;
  receives: {
    tokenId: string;
    from: string;
    token: TokenItem | undefined;
    amount: number;
  }[];
  sends: {
    tokenId: string;
    to: string;
    token: TokenItem | undefined;
    amount: number;
  }[];
  protocol: {
    name: string;
    logoUrl: string;
  } | null;
  id: string;
  chain: string;
  approve?: {
    token_id: string;
    value: number;
    token: TokenItem;
    spender: string;
  };
  status: 'failed' | 'pending' | 'completed' | 'finish';
  otherAddr: string;
  name: string | undefined;
  timeAt: number;
}

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
  };
};

const Transactions = () => {
  const { currentAccount } = useCurrentAccount();
  const [recentTxs, setRecentTxs] = useState<TransactionDataItem[]>([]);
  const [pendingTxs, setPendingTxs] = useState<TransactionDataItem[]>([]);

  const initLocalTxs = useCallback(async () => {
    if (!currentAccount?.address) return;
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const { pendings, completeds } =
      await walletController.getTransactionHistory(currentAccount.address);
    const localTxs: TransactionDataItem[] = [];
    const pTxs: TransactionDataItem[] = [];
    // completeds.filter(
    //   (item) => item.createdAt >= YESTERDAY * 1000 && !item.isSubmitFailed
    // );
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
        const { type, protocol } = getTxInfoFromExplain(item.explain);
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
          name: '',
          timeAt: item.createdAt,
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
    const recent = txs.history_list
      .filter((item) => item.time_at >= YESTERDAY)
      .slice(0, 3);
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
  };

  useEffect(() => {
    init();
  }, [currentAccount]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
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

  const Empty = (
    <EmptyView>
      <img
        src="rabby-internal://assets/icons/home/tx-empty.png"
        className="icon-empty"
      />
      <p>No more transaction in last 24 hours</p>
    </EmptyView>
  );

  if (pendingTxs.length <= 0 && recentTxs.length <= 0) {
    return (
      <TransactionWrapper>
        <Title>Transactions</Title>
        <TransactionList>{Empty}</TransactionList>
      </TransactionWrapper>
    );
  }

  return (
    <TransactionWrapper>
      <Title>Transactions</Title>
      <TransactionList>
        {pendingTxs.map((tx) => {
          return <TransactionItem item={tx} key={`${tx.chain}-${tx.id}`} />;
        })}
        {recentTxs.map((tx) => {
          return <TransactionItem item={tx} key={`${tx.chain}-${tx.id}`} />;
        })}
        {pendingTxs.length + recentTxs.length < 3 && Empty}
      </TransactionList>
    </TransactionWrapper>
  );
};

export default Transactions;
