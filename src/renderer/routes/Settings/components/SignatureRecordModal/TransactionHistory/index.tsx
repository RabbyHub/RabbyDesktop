/* eslint-disable @typescript-eslint/no-shadow */
import { Tooltip } from 'antd';
import clsx from 'clsx';
import { intToHex } from 'ethereumjs-util';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  TransactionGroup,
  TransactionHistoryItem,
} from '@/isomorphic/types/rabbyx';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useDappOriginInfo } from '@/renderer/hooks/useDappOriginInfo';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { getTokenSymbol } from '@/renderer/utils';
import { isSameAddress } from '@/renderer/utils/address';
import { findChainByID } from '@/renderer/utils/chain';
import { CHAINS } from '@/renderer/utils/constant';
import { splitNumberByStep } from '@/renderer/utils/number';
import { sinceTime } from '@/renderer/utils/time';
import {
  ExplainTxResponse,
  GasLevel,
  TokenItem,
} from '@rabby-wallet/rabby-api/dist/types';
import { useInterval, useMemoizedFn, useMount } from 'ahooks';
import { Empty } from '../Empty';
import './style.less';

const IconUnknown = 'rabby-internal://assets/icons/transaction/tx-unknown.svg';

const IconUser = 'rabby-internal://assets/icons/transaction/tx-send.svg';

const TransactionExplain = ({
  isFailed,
  isSubmitFailed,
  isCancel,
  explain,
  onOpenScan,
}: {
  isFailed: boolean;
  isSubmitFailed: boolean;
  isCancel: boolean;
  explain: ExplainTxResponse;
  onOpenScan(): void;
}) => {
  let icon: React.ReactNode = (
    <img className="icon icon-explain" src={IconUnknown} />
  );
  let content: string | React.ReactNode = 'Unknown Transaction';
  if (explain) {
    if (explain.type_cancel_nft_collection_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_nft_collection_approval
              .spender_protocol_logo_url || IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel NFT Collection Approval for{' '}
          {explain.type_cancel_nft_collection_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_nft_collection_approval) {
      icon = (
        <img
          src={
            explain.type_nft_collection_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          NFT Collection Approval for{' '}
          {explain.type_nft_collection_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_cancel_single_nft_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_single_nft_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel Single NFT Approval for{' '}
          {explain.type_cancel_single_nft_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_single_nft_approval) {
      icon = (
        <img
          src={
            explain.type_single_nft_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Single NFT Approval for{' '}
          {explain.type_single_nft_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_nft_send) {
      icon = <img className="icon icon-explain" src={IconUser} />;
      content = `Send ${splitNumberByStep(
        explain.type_nft_send.token_amount
      )} NFT`;
    } else if (explain.type_cancel_token_approval) {
      icon = (
        <img
          src={
            explain.type_cancel_token_approval.spender_protocol_logo_url ||
            IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Cancel {explain.type_cancel_token_approval.token_symbol} Approve for{' '}
          {explain.type_cancel_token_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_token_approval) {
      icon = (
        <img
          src={
            explain.type_token_approval.spender_protocol_logo_url || IconUnknown
          }
          className="icon icon-explain"
        />
      );
      content = (
        <>
          Approve {explain.type_token_approval.token_symbol}{' '}
          {explain.type_token_approval.is_infinity
            ? 'unlimited'
            : splitNumberByStep(explain.type_token_approval.token_amount)}{' '}
          for{' '}
          {explain.type_token_approval.spender_protocol_name ||
            'Unknown protocol'}
        </>
      );
    } else if (explain.type_send) {
      icon = <img className="icon icon-explain" src={IconUser} />;
      content = (
        <>
          Send {splitNumberByStep(explain.type_send.token_amount)}{' '}
          {explain.type_send.token_symbol}
        </>
      );
    } else if (explain.type_call) {
      icon = (
        <img
          src={explain.type_call.contract_protocol_logo_url || IconUnknown}
          className="icon icon-explain"
        />
      );
      content = explain.type_call.action;
    }
  }

  return (
    <div className="tx-explain" onClick={onOpenScan}>
      {icon || <img className="icon icon-explain" src={IconUnknown} />}
      <div className="flex flex-1 justify-between">
        <div className="flex flex-1 items-center tx-explain__text">
          <span>{content || 'Unknown Transaction'}</span>
          {/* <SvgIconOpenExternal className="icon icon-external" /> */}
        </div>
        <span className="text-red-light text-14 font-normal text-right">
          {isCancel && 'Canceled'}
          {isFailed && 'Failed'}
          {isSubmitFailed && 'Failed to submit'}
        </span>
      </div>
    </div>
  );
};

const ChildrenTxText = ({
  tx,
  originTx,
}: {
  tx: TransactionHistoryItem;
  originTx: TransactionHistoryItem;
}) => {
  const isOrigin = tx.hash === originTx.hash;
  const isCancel = isSameAddress(tx.rawTx.from, tx.rawTx.to);
  // const { t } = useTranslation();
  let text = '';

  if (isOrigin) {
    text = 'Initial tx';
  } else if (isCancel) {
    text = 'Cancel tx';
  } else {
    text = 'Speed up tx';
  }
  return <span className="tx-type">{text}</span>;
};

const TransactionWebsiteWrapper = styled.div`
  color: var(--r-neutral-foot, #babec5);
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-decoration-line: underline;
  text-decoration-skip-ink: none;
  text-underline-offset: 2px;

  cursor: pointer;

  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TransactionWebsite = ({ site }: { site: ConnectedSite }) => {
  const { url, openDapp: handleClickLink } = useDappOriginInfo(site.origin);
  if (!url) {
    return null;
    // return <TransactionWebsiteWrapper>Rabby Wallet</TransactionWebsiteWrapper>;
  }
  return (
    <TransactionWebsiteWrapper
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClickLink();
      }}
    >
      {url}
    </TransactionWebsiteWrapper>
  );
};

const ChildrenWrapper = styled.div`
  padding: 2px;
  padding-top: 0;
`;

const TransactionItem = ({
  item,
  canCancel,
  onComplete,
}: {
  item: TransactionGroup;
  canCancel: boolean;
  onComplete?(): void;
}) => {
  const chain = Object.values(CHAINS).find((c) => c.id === item.chainId)!;
  const originTx = minBy(item.txs, (tx) => tx.createdAt)!;
  const maxGasTx = maxBy(item.txs, (tx) =>
    Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
  )!;
  const completedTx = item.txs.find((tx) => tx.isCompleted);
  const isCompleted = !item.isPending || item.isSubmitFailed;
  const isCanceled =
    !item.isPending &&
    item.txs.length > 1 &&
    isSameAddress(completedTx!.rawTx.from, completedTx!.rawTx.to);
  const [txQueues, setTxQueues] = useState<
    Record<
      string,
      {
        frontTx?: number;
        gasUsed?: number;
        token?: TokenItem;
        tokenCount?: number;
      }
    >
  >({});

  const hasTokenPrice = !!item.explain?.native_token;
  const gasTokenCount =
    hasTokenPrice && completedTx
      ? (Number(
          completedTx.rawTx.gasPrice || completedTx.rawTx.maxFeePerGas || 0
        ) *
          (completedTx.gasUsed || 0)) /
        1e18
      : 0;
  const gasUSDValue = gasTokenCount
    ? (item.explain.native_token.price * gasTokenCount).toFixed(2)
    : 0;
  const gasTokenSymbol = hasTokenPrice
    ? getTokenSymbol(item.explain.native_token)
    : '';

  const loadTxData = useMemoizedFn(async () => {
    if (gasTokenCount) return;

    const results = await Promise.all(
      item.txs
        .filter((tx) => !tx.isSubmitFailed)
        .map((tx) =>
          walletOpenapi.getTx(
            chain.serverId,
            tx.hash,
            Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
          )
        )
    );
    let map = {};
    results.forEach(
      ({ code, status, front_tx_count, gas_used, token }, index) => {
        if (isCompleted) {
          if (!completedTx!.gasUsed) {
            map = {
              ...map,
              [item.txs[index].hash]: {
                token,
                tokenCount:
                  (gas_used *
                    Number(
                      completedTx!.rawTx.gasPrice ||
                        completedTx!.rawTx.maxFeePerGas ||
                        0
                    )) /
                  1e18,
                gasUsed: gas_used,
              },
            };
          } else if (code === 0) {
            map = {
              ...map,
              [item.txs[index].hash]: {
                token,
                gasUsed: completedTx!.gasUsed,
                tokenCount:
                  (completedTx!.gasUsed *
                    Number(
                      completedTx!.rawTx.gasPrice ||
                        completedTx!.rawTx.maxFeePerGas ||
                        0
                    )) /
                  1e18,
              },
            };
          }
        } else if (status !== 0 && code === 0) {
          // wallet.completedTransaction({
          //   address: item.txs[index].rawTx.from,
          //   chainId: Number(item.txs[index].rawTx.chainId),
          //   nonce: Number(item.txs[index].rawTx.nonce),
          //   hash: item.txs[index].hash,
          //   success: status === 1,
          //   gasUsed: gas_used,
          // });
        } else {
          map = {
            ...map,
            [item.txs[index].hash]: {
              frontTx: front_tx_count,
            },
          };
        }
      }
    );
    if (!isCompleted && results.some((i) => i.status !== 0 && i.code === 0)) {
      onComplete?.();
    } else {
      setTxQueues(map);
    }
  });

  useEffect(() => {
    loadTxData();
  }, [item.txs?.length, loadTxData]);

  const handleClickCancel = async () => {
    if (!canCancel) return;
    const maxGasTx = maxBy(item.txs, (tx) =>
      Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
    )!;
    const maxGasPrice = Number(
      maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
    );
    const chainServerId = Object.values(CHAINS).find(
      (chain) => chain.id === item.chainId
    )!.serverId;
    const gasLevels: GasLevel[] = await walletOpenapi.gasMarket(chainServerId);
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)!.price;
    await walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: maxGasTx.rawTx.from,
          to: maxGasTx.rawTx.from,
          gasPrice: intToHex(Math.max(maxGasPrice * 2, maxGasMarketPrice)),
          value: '0x0',
          chainId: item.chainId,
          nonce: intToHex(item.nonce),
          isCancel: true,
        },
      ],
    });
  };

  const handleClickSpeedUp = async () => {
    if (!canCancel) return;
    const maxGasTx = maxBy(item.txs, (tx) =>
      Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
    )!;
    const maxGasPrice = Number(
      maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
    );
    const chainServerId = Object.values(CHAINS).find(
      (chain) => chain.id === item.chainId
    )!.serverId;
    const gasLevels: GasLevel[] = await walletOpenapi.gasMarket(chainServerId);
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)!.price;
    await walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: originTx.rawTx.from,
          value: originTx.rawTx.value,
          data: originTx.rawTx.data,
          nonce: originTx.rawTx.nonce,
          chainId: originTx.rawTx.chainId,
          to: originTx.rawTx.to,
          gasPrice: intToHex(
            Math.round(Math.max(maxGasPrice * 2, maxGasMarketPrice))
          ),
          isSpeedUp: true,
        },
      ],
    });
  };

  const handleOpenScan = () => {
    if (completedTx?.isSubmitFailed) return;
    let hash = '';
    if (isCompleted) {
      hash = completedTx!.hash;
    } else {
      const maxGasTx = maxBy(item.txs, (tx) =>
        Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
      )!;
      hash = maxGasTx.hash;
    }
    openExternalUrl(chain.scanLink.replace(/_s_/, hash));
  };

  const isPending = item.isPending && !item.isSubmitFailed;

  return (
    <div
      className={clsx('tx-history__item', {
        'opacity-50': isCanceled || item.isFailed || item.isSubmitFailed,
      })}
    >
      <div className="tx-history__item--main">
        {isPending && (
          <div className="pending flex items-center gap-[6px]">
            <img
              src="rabby-internal://assets/icons/home/tx-pending.svg"
              className="animate-spin"
            />
            Pending
          </div>
        )}
        <div className="tx-id">
          <span>{isPending ? null : sinceTime(item.createdAt / 1000)}</span>
          {!item.isSubmitFailed && (
            <span>
              {chain?.name} #{item.nonce}
            </span>
          )}
        </div>
        <div className="flex">
          <TransactionExplain
            isFailed={item.isFailed}
            isCancel={isCanceled}
            isSubmitFailed={!!item.isSubmitFailed}
            explain={item.explain}
            onOpenScan={handleOpenScan}
          />
          {isPending && (
            <div
              className={clsx('tx-footer__actions', {
                'opacity-40': !canCancel,
              })}
            >
              <Tooltip
                title={
                  canCancel
                    ? null
                    : 'Cannot speed up or cancel: Not the first pending tx'
                }
                placement="topRight"
                autoAdjustOverflow={false}
              >
                <div className="flex items-center">
                  <Tooltip title={canCancel ? 'Speed up' : null}>
                    <img
                      className={clsx('icon icon-action', {
                        'cursor-not-allowed': !canCancel,
                      })}
                      src="rabby-internal://assets/icons/home/action-speedup.svg"
                      onClick={handleClickSpeedUp}
                    />
                  </Tooltip>
                  <div className="hr" />
                  <Tooltip title={canCancel ? 'Cancel' : null}>
                    <img
                      className={clsx('icon icon-action', {
                        'cursor-not-allowed': !canCancel,
                      })}
                      src="rabby-internal://assets/icons/home/action-cancel.svg"
                      onClick={handleClickCancel}
                    />
                  </Tooltip>
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        {isPending ? (
          <div className="tx-footer">
            {originTx.site && <TransactionWebsite site={originTx.site} />}
            <div className="ahead">
              {txQueues[originTx.hash] ? (
                <>
                  {Number(
                    maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
                  ) / 1e9}{' '}
                  Gwei{' '}
                </>
              ) : (
                'Unknown'
              )}
            </div>
          </div>
        ) : (
          <div className="tx-footer justify-between text-12">
            {item.isSubmitFailed ? (
              originTx.site && <TransactionWebsite site={originTx.site} />
            ) : (
              <>
                {completedTx?.site ? (
                  <TransactionWebsite site={completedTx.site} />
                ) : (
                  <span className="flex-1 whitespace-nowrap overflow-ellipsis overflow-hidden" />
                )}
                <span className="whitespace-nowrap overflow-ellipsis overflow-hidden text-right ml-auto">
                  Gas:{' '}
                  {gasTokenCount
                    ? `${gasTokenCount.toFixed(
                        6
                      )} ${gasTokenSymbol} ($${gasUSDValue})`
                    : txQueues[completedTx!.hash]
                    ? `${txQueues[completedTx!.hash].tokenCount?.toFixed(
                        8
                      )} ${getTokenSymbol(
                        txQueues[completedTx!.hash].token
                      )} ($${(
                        txQueues[completedTx!.hash].tokenCount! *
                        (txQueues[completedTx!.hash].token?.price || 1)
                      ).toFixed(2)})`
                    : 'Unknown'}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {isPending && item.txs.length > 1 && (
        <ChildrenWrapper>
          <div className="tx-history__item--children">
            <div className="pending-detail">
              Pending detail
              <Tooltip
                title="Only one transaction will be completed, and it is almost always the one with the highest gas price"
                overlayClassName="rectangle pending-detail__tooltip"
                autoAdjustOverflow={false}
              >
                <img
                  className="icon icon-question-mark"
                  src="rabby-internal://assets/icons/home/question.svg"
                />
              </Tooltip>
            </div>
            {item.txs
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((tx, index) => (
                <div
                  className={clsx('tx-history__item--children__item', {
                    'opacity-50': index >= 1,
                  })}
                  key={tx.hash}
                >
                  <ChildrenTxText tx={tx} originTx={originTx} />
                  <div className="ahead">
                    {txQueues[tx.hash] ? (
                      <>
                        {Number(
                          tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0
                        ) / 1e9}{' '}
                        Gwei{' '}
                      </>
                    ) : (
                      'Unknown'
                    )}
                  </div>
                  <img
                    src="rabby-internal://assets/icons/home/tx-pending-1.svg"
                    className="animate-spin"
                  />
                </div>
              ))}
          </div>
        </ChildrenWrapper>
      )}
    </div>
  );
};

export const TransactionHistory = () => {
  const [_pendingList, setPendingList] = useState<TransactionGroup[]>([]);
  const [_completeList, setCompleteList] = useState<TransactionGroup[]>([]);
  const { currentAccount } = useCurrentAccount();

  const pendingList = useMemo(() => {
    return _pendingList.filter((item) => !!findChainByID(item?.chainId));
  }, [_pendingList]);

  const completeList = useMemo(() => {
    return _completeList.filter((item) => !!findChainByID(item?.chainId));
  }, [_completeList]);

  const init = useCallback(async (address: string) => {
    const { pendings, completeds } =
      await walletController.getTransactionHistory(address);
    setPendingList(pendings);
    setCompleteList(completeds);
  }, []);

  const loadList = async () => {
    const account = await walletController.syncGetCurrentAccount();
    if (!account) return;
    const pendings = await walletController.loadPendingListQueue(
      account.address
    );
    setPendingList(pendings);

    const { completeds } = await walletController.getTransactionHistory(
      account.address
    );
    setCompleteList(completeds);
  };

  useInterval(() => {
    if ((pendingList?.length || 0) > 0) {
      loadList();
    }
  }, 1000);

  const handleTxComplete = () => {
    if (currentAccount?.address) {
      init(currentAccount?.address);
    }
  };

  useEffect(() => {
    if (currentAccount?.address) {
      init(currentAccount.address);
    }
  }, [currentAccount?.address, init]);

  const isEmpty = useMemo(() => {
    return pendingList.length <= 0 && completeList.length <= 0;
  }, [pendingList, completeList]);

  return (
    <div className="tx-history">
      {pendingList.length > 0 && (
        <div className="tx-history__pending">
          {pendingList.map((item) => (
            <TransactionItem
              item={item}
              key={`${item.chainId}-${item.nonce}`}
              canCancel={
                minBy(
                  pendingList.filter((i) => i.chainId === item.chainId),
                  (i) => i.nonce
                )?.nonce === item.nonce
              }
              onComplete={() => handleTxComplete()}
            />
          ))}
        </div>
      )}
      {completeList.length > 0 && (
        <div className="tx-history__completed">
          {completeList.map((item) => (
            <TransactionItem
              item={item}
              key={`${item.chainId}-${item.nonce}`}
              canCancel={false}
            />
          ))}
        </div>
      )}
      {isEmpty ? (
        <Empty
          title="No signed transactions yet"
          desc="All transactions signed via Rabby will be listed here."
          className="pt-[120px]"
        />
      ) : null}
    </div>
  );
};
