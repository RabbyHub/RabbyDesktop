import type {
  TransactionDataItem,
  TransactionGroup,
  TransactionHistoryItem,
} from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import {
  walletController,
  walletOpenapi,
  walletTestnetOpenapi,
} from '@/renderer/ipcRequest/rabbyx';
import { CHAINS, CHAINS_LIST } from '@debank/common';
import {
  TokenItem,
  TransferingNFTItem,
  TxHistoryResult,
} from '@rabby-wallet/rabby-api/dist/types';
import { maxBy, mergeWith, minBy, sortBy } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useInterval, useLocation, usePrevious } from 'react-use';
import styled from 'styled-components';
// eslint-disable-next-line import/no-cycle
import { TransactionModal } from '@/renderer/components/TransactionsModal';
import TransactionItem, { LoadingTransactionItem } from './TransactionItem';

const TransactionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow: hidden;
  position: absolute;
  right: -330px;
  width: 302px;
  top: 0;
`;

const TransactionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  flex: 1;
  overflow: overlay;
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

const filterTestnet = (list: TransactionDataItem[], isTestnet?: boolean) => {
  return list.filter((item) => {
    const chain = Object.values(CHAINS).find((i) => i.serverId === item.chain);
    if (isTestnet) {
      return chain?.isTestnet;
    }
    return !chain?.isTestnet;
  });
};
const Transactions = ({
  updateNonce,
  isTestnet,
  onTabChange,
}: {
  updateNonce: number;
  isTestnet?: boolean;
  onTabChange?: (v: 'mainnet' | 'testnet') => void;
}) => {
  const { currentAccount } = useCurrentAccount();
  const [recentTxs, setRecentTxs] = useState<TransactionDataItem[]>([]);
  const remoteTxsRef = useRef<TxHistoryResult['history_list']>([]);
  const [pendingTxs, setPendingTxs] = useState<TransactionDataItem[]>([]);
  const [localTxs, setLocalTxs] = useState<TransactionDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevAccount = usePrevious(currentAccount);
  const prevNonce = usePrevious(updateNonce);

  const completedTxs = useMemo(() => {
    return localTxs.filter(
      (item) =>
        !recentTxs.find((i) => item.id === i.id && item.chain === i.chain)
    );
  }, [recentTxs, localTxs]);

  const mergedRecentTxs = useMemo(() => {
    return sortBy(
      [
        ...filterTestnet(recentTxs, isTestnet).slice(0, 3),
        ...filterTestnet(completedTxs, isTestnet),
      ],
      'timeAt'
    ).reverse();
  }, [recentTxs, completedTxs, isTestnet]);

  const initLocalTxs = async (address: string) => {
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const { pendings, completeds } =
      await walletController.getTransactionHistory(address);
    const lTxs: TransactionDataItem[] = [];
    const pTxs: TransactionDataItem[] = [];
    const markedCompleteds = completeds.map((item) => {
      if (!item.dbIndexed) {
        const chain = CHAINS_LIST.find((c) => c.id === item.chainId);
        if (chain) {
          const target = remoteTxsRef.current.find((i) =>
            item.txs.find(
              (tx) => tx.hash === i.id && i.chain === chain.serverId
            )
          );
          if (target) {
            walletController.markTransactionAsIndexed(
              address,
              chain.id,
              target.id
            );
            return {
              ...item,
              dbIndexed: true,
            };
          }
        }
      }
      return item;
    });
    markedCompleteds
      .filter(
        (item) =>
          (item.completedAt || item.createdAt) >= Date.now() - 3600000 &&
          !item.isSubmitFailed &&
          !item.dbIndexed
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
          id: completedTx?.hash || maxTx!.hash,
          chain: chain.serverId,
          status: 'completed',
          otherAddr: maxTx.rawTx.to || '',
          name,
          timeAt: item.completedAt || item.createdAt,
          site: completedTx?.site,
        });
      });
    setLocalTxs(lTxs);
    pendings
      .filter((item) => !item.isSubmitFailed)
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
          site: originTx?.site,
          txs: item.txs,
        });
      });
    setPendingTxs(pTxs);
  };

  const init = async (address?: string) => {
    if (!address) return;
    const YESTERDAY = Math.floor(Date.now() / 1000 - 3600 * 24);
    const txs = await Promise.all([
      walletOpenapi.listTxHisotry({
        id: address,
      }),
      walletTestnetOpenapi.listTxHisotry({
        id: address,
      }),
    ]).then(([txHistory, testnetTxHistory]) => {
      return mergeWith(txHistory, testnetTxHistory, (objValue, srcValue) => {
        if (Array.isArray(objValue)) {
          return [...objValue, ...srcValue];
        }
      });
    });

    const { completeds } = await walletController.getTransactionHistory(
      address
    );
    remoteTxsRef.current = txs.history_list || [];
    const recent = txs.history_list.filter((item) => item.time_at >= YESTERDAY);
    const dbTxs = recent.map((item) => {
      let localTx: TransactionHistoryItem | null = null;
      for (let i = 0; i < completeds.length; i++) {
        const group = completeds[i];
        const chain = CHAINS_LIST.find((c) => group.chainId === c.id);
        if (chain && item.chain === chain.serverId) {
          localTx = group.txs.find((tx) => tx.hash === item.id) || null;
          if (localTx) break;
        }
      }
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
        isScam: item.is_scam,
      };
      if (localTx) {
        data.rawTx = localTx.rawTx;
        data.site = localTx.site;
      }
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
    initLocalTxs(address);
    setRecentTxs(sortBy(dbTxs, 'timeAt').reverse());
    setIsLoading(false);
  };

  useInterval(
    () => init(currentAccount?.address),
    pendingTxs.length > 0 || completedTxs.length > 0 ? 5000 : 60 * 1000
  );

  useEffect(() => {
    if (
      !currentAccount ||
      (prevAccount?.address === currentAccount.address &&
        prevNonce === updateNonce)
    )
      return;
    setIsLoading(true);
    init(currentAccount.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount, updateNonce]);

  useEffect(() => {
    if (!currentAccount) return;
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        if (payload.event === 'clearPendingTransactions') {
          initLocalTxs(currentAccount.address);
          return;
        }
        if (payload.event !== 'transactionChanged') return;
        switch (payload.data?.type) {
          default:
            break;
          case 'submitted': {
            initLocalTxs(currentAccount.address);
            break;
          }
          case 'finished': {
            initLocalTxs(currentAccount.address);
            break;
          }
        }
      }
    );
  }, [currentAccount]);

  const [isShowAll, setIsShowAll] = useState(false);

  const location = useLocation();
  useEffect(() => {
    setIsShowAll(false);
  }, [location.hash]);

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
              remoteTxsRef.current.length > 0
                ? 'No transaction in last 24 hours'
                : 'No transaction'
            }
          />
        </TransactionList>
        {remoteTxsRef.current.length > 0 && (
          <ViewAllButton
            onClick={() => {
              setIsShowAll(true);
            }}
          >
            View All Transactions
          </ViewAllButton>
        )}
        <TransactionModal
          open={isShowAll}
          initialTabOnOpen={isTestnet ? 'testnet' : 'mainnet'}
          onClose={() => {
            setIsShowAll(false);
          }}
        />
      </TransactionWrapper>
    );
  }

  return (
    <TransactionWrapper>
      <TransactionList>
        {filterTestnet(pendingTxs, isTestnet).map((tx) => {
          return (
            <TransactionItem
              item={tx}
              key={`${tx.chain}-${tx.id}`}
              canCancel={
                minBy(
                  pendingTxs.filter((i) => i.chain === tx.chain),
                  (i) => i.rawTx?.nonce
                )?.rawTx?.nonce === tx.rawTx?.nonce
              }
            />
          );
        })}
        {mergedRecentTxs.map((tx) => {
          return <TransactionItem item={tx} key={`${tx.chain}-${tx.id}`} />;
        })}
      </TransactionList>
      <ViewAllButton
        onClick={() => {
          setIsShowAll(true);
        }}
      >
        View All Transactions
      </ViewAllButton>
      <TransactionModal
        open={isShowAll}
        initialTabOnOpen={isTestnet ? 'testnet' : 'mainnet'}
        onClose={() => {
          setIsShowAll(false);
        }}
      />
    </TransactionWrapper>
  );
};

export default Transactions;
