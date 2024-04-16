/* eslint-disable @typescript-eslint/no-shadow */
import { Tooltip, message } from 'antd';
import clsx from 'clsx';
import { intToHex } from 'ethereumjs-util';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import { useState } from 'react';
import styled from 'styled-components';

import { checkIsPendingTxGroup, findMaxGasTx } from '@/isomorphic/tx';
import {
  TransactionGroup,
  TransactionHistoryItem,
} from '@/isomorphic/types/rabbyx';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { getTokenSymbol } from '@/renderer/utils';
import { isSameAddress } from '@/renderer/utils/address';
import { findChain } from '@/renderer/utils/chain';
import { CANCEL_TX_TYPE } from '@/renderer/utils/constant';
import { sinceTime } from '@/renderer/utils/time';
import { GasLevel, TxRequest } from '@rabby-wallet/rabby-api/dist/types';
import { useLoadTxData } from '../hooks';
import { CancelTxPopup } from './CancelTxPopup';
import { ChildrenTxText } from './ChildrenTxText';
import { TransactionExplain } from './TransactionExplain';
import { TransactionPendingTag } from './TransactionPendingTag';
import { TransactionWebsite } from './TransactionWebsite';

const ChildrenWrapper = styled.div`
  padding: 2px;
  padding-top: 0;
`;

export const TransactionItem = ({
  item,
  canCancel,
  reload,
  txRequests,
}: {
  item: TransactionGroup;
  canCancel: boolean;
  reload?(): void;
  txRequests: Record<string, TxRequest>;
}) => {
  const [isShowCancelPopup, setIsShowCancelPopup] = useState(false);
  const chain = findChain({
    id: item.chainId,
  })!;
  const originTx = minBy(item.txs, (tx) => tx.createdAt)!;
  const maxGasTx = findMaxGasTx(item.txs);
  const completedTx = item.txs.find(
    (tx) => tx.isCompleted && !tx.isSubmitFailed && !tx.isWithdrawed
  );

  const isCanceled =
    !item.isPending &&
    item.txs.length > 1 &&
    isSameAddress(completedTx!.rawTx.from, completedTx!.rawTx.to);

  const { txQueues, gasTokenCount, gasTokenSymbol, gasUSDValue } =
    useLoadTxData(item);

  const handleClickCancel = () => {
    setIsShowCancelPopup(true);
  };

  const handleQuickCancel = async () => {
    const maxGasTx = findMaxGasTx(item.txs);
    if (maxGasTx?.reqId) {
      try {
        await walletController.quickCancelTx({
          reqId: maxGasTx.reqId,
          chainId: maxGasTx.rawTx.chainId,
          nonce: +maxGasTx.rawTx.nonce,
          address: maxGasTx.rawTx.from,
        });
        reload?.();
        message.success('Canceled');
      } catch (e: any) {
        message.error(e.message);
      }
    }
  };

  const handleReBroadcast = async (tx: TransactionHistoryItem) => {
    const wallet = walletController;
    if (!tx.reqId) {
      message.error('Can not re-broadcast');
      return;
    }

    const isReBroadcast = !!tx.hash;
    if (isReBroadcast) {
      // fake toast for re-broadcast, not wait for tx push
      message.success('Re-broadcasted');
      wallet.retryPushTx({
        reqId: tx.reqId,
        chainId: tx.rawTx.chainId,
        nonce: +tx.rawTx.nonce,
        address: tx.rawTx.from,
      });
      return;
    }
    try {
      await wallet.retryPushTx({
        reqId: tx.reqId,
        chainId: tx.rawTx.chainId,
        nonce: +tx.rawTx.nonce,
        address: tx.rawTx.from,
      });
      message.success('Broadcasted');
    } catch (e: any) {
      console.error(e);
      message.error(e.message);
    }
  };

  const handleOnChainCancel = async () => {
    if (!canCancel) return;
    const maxGasTx = findMaxGasTx(item.txs)!;
    const maxGasPrice = Number(
      maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
    );
    const chainServerId = findChain({
      id: item.chainId,
    })!.serverId;
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
          reqId: maxGasTx.reqId,
        },
      ],
    });
    reload?.();
  };

  const handleCancelTx = (mode: CANCEL_TX_TYPE) => {
    if (mode === CANCEL_TX_TYPE.QUICK_CANCEL) {
      handleQuickCancel();
    }
    if (mode === CANCEL_TX_TYPE.ON_CHAIN_CANCEL) {
      handleOnChainCancel();
    }
    setIsShowCancelPopup(false);
  };

  const handleClickSpeedUp = async () => {
    if (!canCancel) return;
    const maxGasTx = findMaxGasTx(item.txs);
    const maxGasPrice = Number(
      maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
    );
    const chainServerId = findChain({
      id: item.chainId,
    })!.serverId;
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
          reqId: maxGasTx.reqId,
        },
      ],
    });
    reload?.();
  };

  const handleOpenScan = () => {
    let hash: string | undefined = '';
    if (completedTx) {
      hash = completedTx?.hash;
    } else {
      const maxGasTx = findMaxGasTx(item.txs)!;
      hash = maxGasTx.hash;
    }
    if (!hash) {
      return;
    }
    openExternalUrl(chain.scanLink.replace(/_s_/, hash));
  };

  const isPending = checkIsPendingTxGroup(item);

  return (
    <div
      className={clsx('tx-history__item', {
        'opacity-50': isCanceled || item.isFailed || item.isSubmitFailed,
      })}
    >
      <div className="tx-history__item--main">
        {isPending && (
          <TransactionPendingTag
            item={item}
            onReBroadcast={handleReBroadcast}
            txRequests={txRequests || {}}
          />
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
            isWithdrawed={!!maxGasTx?.isWithdrawed}
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
                      src="rabby-internal://assets/icons/signature-record/speed-up.svg"
                      onClick={handleClickSpeedUp}
                    />
                  </Tooltip>
                  <div className="hr" />
                  <Tooltip title={canCancel ? 'Cancel' : null}>
                    <img
                      className={clsx('icon icon-action', {
                        'cursor-not-allowed': !canCancel,
                      })}
                      src="rabby-internal://assets/icons/signature-record/close.svg"
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
            <div className="ahead ml-auto">
              {/* {txQueues[originTx.hash] ? (
                <>
                  {Number(
                    maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
                  ) / 1e9}{' '}
                  Gwei{' '}
                </>
              ) : (
                'Unknown'
              )} */}
              <>
                {Number(
                  maxGasTx.rawTx.gasPrice || maxGasTx.rawTx.maxFeePerGas || 0
                ) / 1e9}{' '}
                Gwei{' '}
              </>
            </div>
          </div>
        ) : (
          <div className="tx-footer justify-between text-12">
            {item.isSubmitFailed || maxGasTx.isWithdrawed ? (
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
                    : txQueues[completedTx!.hash!]
                    ? `${txQueues[completedTx!.hash!].tokenCount?.toFixed(
                        8
                      )} ${getTokenSymbol(
                        txQueues[completedTx!.hash!].token
                      )} ($${(
                        txQueues[completedTx!.hash!].tokenCount! *
                        (txQueues[completedTx!.hash!].token?.price || 1)
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
                  <div className="ahead ml-auto">
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
      <CancelTxPopup
        visible={isShowCancelPopup}
        onClose={() => {
          setIsShowCancelPopup(false);
        }}
        onCancelTx={handleCancelTx}
        tx={maxGasTx}
      />
    </div>
  );
};
