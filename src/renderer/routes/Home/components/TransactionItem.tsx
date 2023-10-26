/* eslint-disable import/no-cycle */
import styled from 'styled-components';
import { Tooltip, Skeleton, message } from 'antd';
import { intToHex } from 'ethereumjs-util';
import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import {
  GasLevel,
  TokenItem,
  TxRequest,
} from '@rabby-wallet/rabby-api/dist/types';
import { maxBy, minBy } from 'lodash';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import NameAndAddress from '@/renderer/components/NameAndAddress';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { sinceTime } from '@/renderer/utils/time';
import {
  TransactionDataItem,
  TransactionHistoryItem,
} from '@/isomorphic/types/rabbyx';
import { ellipsis, isSameAddress } from '@/renderer/utils/address';
import { TransactionWebsite } from '@/renderer/components/TransactionWebsite';
import moment from 'moment';
import { getChain, getTokenSymbol } from '@/renderer/utils';
import clsx from 'clsx';
import { openExternalUrl } from '@/renderer/ipcRequest/app';
import { findMaxGasTx } from '@/isomorphic/tx';
import { CANCEL_TX_TYPE } from '@/renderer/utils/constant';
import TxChange from './TxChange';
import { TransactionPendingTag } from '../../Settings/components/SignatureRecordModal/TransactionHistory/components/TransactionPendingTag';
import { CancelTxPopup } from '../../Settings/components/SignatureRecordModal/TransactionHistory/components/CancelTxPopup';

const TransactionItemWrapper = styled.div`
  // display: flex;
  padding: 28px 16px 28px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.11);
  position: relative;
  .pending-tooltip {
    position: absolute;
    left: 80px;
    top: 5px;
    display: none;
  }
  .name-and-address .icon-copy {
    visibility: hidden;
    width: 14px;
    height: 14px;
  }
  &:hover {
    .tx-origin {
      display: block;
    }
    .name-and-address .icon-copy {
      visibility: visible;
    }
    .pending-tooltip {
      display: block;
    }
    .tx-hash {
      display: block;
    }
  }
  .tx-time {
    position: absolute;
    left: 10px;
    top: 5px;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.3);
  }
  .tx-origin {
    display: none;
    margin-top: 15px;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.3);
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .tx-dapp-link {
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .tx-hash {
    position: absolute;
    right: 16px;
    top: 7px;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    text-decoration-line: underline;
    color: #ffffff;
    opacity: 0.3;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
    display: none;
  }
  &.scam {
    padding-top: 30px;
    .token-with-chain {
      opacity: 0.3;
    }
    .tx-explain {
      &-title {
        color: rgba(255, 255, 255, 0.3);
      }
      &-desc {
        color: rgba(255, 255, 255, 0.15);
      }
    }
    .token-change {
      color: rgba(255, 255, 255, 0.3);
    }
    .tx-time {
      left: 66px;
    }
  }
  &.failed {
    padding-top: 30px;
    .token-with-chain {
      opacity: 0.3;
    }
    .tx-explain {
      &-title {
        color: rgba(255, 255, 255, 0.3);
      }
      &-desc {
        color: rgba(255, 255, 255, 0.15);
      }
    }
    .token-change {
      color: rgba(255, 255, 255, 0.3);
    }
    .tx-time {
      left: 29px;
    }
  }
  &.scam.failed {
    .tx-time {
      left: 90px;
    }
    .failed-tag {
      left: 66px;
      border-bottom-left-radius: 4px;
    }
  }
  &.pending {
    padding-top: 38px;
    .tx-hash {
      right: 65px;
    }
  }
  &.completed {
    .tx-time {
      left: 93px;
    }
  }
  &:nth-last-child(1) {
    border-bottom: none;
  }
`;

const Actions = styled.div`
  position: absolute;
  top: 8px;
  right: 16px;
  display: flex;
  align-items: center;
  .icon-cancel {
    width: 9px;
  }
  .icon-speedup {
    width: 6px;
  }
  .icon-cancel,
  .icon-speedup {
    opacity: 0.3;
    cursor: pointer;
    transition: opacity 0.3s;
  }
  .icon-cancel:hover,
  .icon-speedup:hover {
    opacity: 1;
  }
  .divider {
    height: 8px;
    width: 1px;
    background-color: rgba(255, 255, 255, 0.3);
    margin-left: 10px;
    margin-right: 10px;
  }
  &.disabled {
    opacity: 0.4;
    .icon-cancel,
    .icon-speedup {
      cursor: not-allowed;
    }
    .icon-cancel:hover,
    .icon-speedup:hover {
      opacity: 0.3;
    }
  }
`;

const PendingTag = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  background: #686d7c;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #ffc55c;
  padding: 4px 7px;
  border-bottom-right-radius: 4px;
  display: flex;
  align-items: center;
  @keyframes spining {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .icon-pending {
    width: 10px;
    margin-right: 3px;
    animation: spining 1.5s infinite linear;
  }
`;

const PendingTagGroup = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding-right: 65px;

  .pending {
    background-color: rgba(242, 156, 27, 0.2);
    border-radius: 0px 0px 4px 0px;
    padding: 4px 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    line-height: 14px;
    color: var(--r-orange-default, #ffc64a);
    .icon-pending-spin {
      width: 12px;
      height: 12px;
      animation: spining 1.5s infinite linear;
      margin-right: 6px;
    }
  }

  .tx-hash {
    position: static;
    margin-left: auto;
    margin-top: 6px;
  }
  .pending-tooltip {
    position: static;
    margin-top: 6px;
  }
`;

const CompletedTag = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 7px;
  border-bottom-right-radius: 4px;
  display: flex;
  align-items: center;
  .icon-completed {
    width: 11px;
    margin-right: 3px;
  }
`;

const ScamTag = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: rgba(255, 255, 255, 0.3);
  padding: 3px 7px;
  border-bottom-right-radius: 4px;
  display: flex;
  align-items: center;
`;

const FailedTag = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  padding: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom-right-radius: 4px;
  .icon-failed {
    display: block;
  }
`;

const TxExplain = styled.div`
  width: 100%;
  display: flex;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 500;
  font-size: 13px;
  line-height: 16px;
  align-items: center;
  .token-with-chain {
    margin-right: 11px;
    .chain-logo {
      width: 12px;
      height: 12px;
      bottom: -2px;
      right: -4px;
    }
  }
  .name-and-address {
    justify-content: flex-start;
    .address,
    .name {
      color: rgba(255, 255, 255, 0.3);
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
    }
  }
  &.has-bg {
    .token-logo {
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.7);
    }
  }
`;

const TxExplainInner = styled.div`
  flex: 1;
  overflow: hidden;
  .tx-explain-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tx-explain-desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
  }
`;

const ChildrenWrapper = styled.div`
  padding: 15px 0 0;
  border-top: 1px dashed #616776;
  margin-top: 15px;

  .pending-detail {
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.75);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  .tx-history__item--children__item {
    display: flex;
    align-items: center;
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    color: #d9d9d9;
    opacity: 0.3;

    &.active {
      color: #fff;
      opacity: 0.75;
    }

    .tx-type {
      width: 80px;
    }
    .ahead {
      flex: 1;
      margin-left: 75px;
      font-size: 12px;
    }
    .icon-spin {
      width: 14px;
      height: 14px;
      animation: spining 1.5s infinite linear;
    }

    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }
`;

const PendingTooltip = ({ timeAt }: { timeAt: number }) => {
  const isAlwaysShow = moment().isAfter(moment(timeAt).add(1, 'hour'));
  return (
    <Tooltip
      title="Tx submitted. If the tx is pending for long hours, you can try to clear pending in settings."
      overlayStyle={{ maxWidth: 306 }}
    >
      <img
        src="rabby-internal://assets/icons/home/question-outline.svg"
        className="pending-tooltip"
        style={isAlwaysShow ? { display: 'block' } : undefined}
      />
    </Tooltip>
  );
};

const TxHash = ({
  item,
  className,
}: {
  item: TransactionDataItem;
  className?: string;
}) => {
  if (!item.id) {
    return null;
  }
  const chain = getChain(item.chain);
  const link = chain?.scanLink.replace(/_s_/, item.id);
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (link) {
      openExternalUrl(link);
    }
  };
  if (!link) {
    return null;
  }
  return (
    <a href={link} className={clsx('tx-hash', className)} onClick={handleClick}>
      {ellipsis(item.id)}
    </a>
  );
};

export const LoadingTransactionItem = () => {
  return (
    <TransactionItemWrapper>
      <TxExplain className="tx-explain">
        <Skeleton.Input
          active
          style={{
            borderRadius: '2px',
            width: '26px',
            height: '26px',
            marginRight: '10px',
          }}
        />
        <TxExplainInner>
          <Skeleton.Input
            active
            style={{
              width: '92px',
              height: '14px',
            }}
          />
        </TxExplainInner>
        <Skeleton.Input
          active
          style={{
            width: '92px',
            height: '14px',
            marginLeft: '27px',
          }}
        />
      </TxExplain>
    </TransactionItemWrapper>
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

const TransactionItem = ({
  item,
  canCancel,
  txRequests,
  reload,
}: {
  item: TransactionDataItem;
  canCancel?: boolean;
  txRequests?: Record<string, TxRequest>;
  reload?(): void;
}) => {
  const [isShowCancelPopup, setIsShowCancelPopup] = useState(false);

  const { isPending, isCompleted, isFailed, isScam } = useMemo(() => {
    return {
      isPending: item.status === 'pending',
      isCompleted: item.status === 'completed',
      isFailed: item.status === 'failed',
      isScam: item.isScam,
    };
  }, [item]);

  const { isApprove, isSend, isReceive, isCancel } = useMemo(() => {
    return {
      isApprove: item.type === 'approve',
      isSend: item.type === 'send',
      isReceive: item.type === 'receive',
      isCancel: item.type === 'cancel',
    };
  }, [item]);

  const iconUrl = useMemo(() => {
    if (isCancel) return 'rabby-internal://assets/icons/home/tx-cancel.svg';
    if (isSend) return 'rabby-internal://assets/icons/home/tx-send.svg';
    if (isReceive) return 'rabby-internal://assets/icons/home/tx-receive.svg';
    if (item.protocol?.logoUrl) return item.protocol.logoUrl;
    return null;
  }, [item, isCancel, isSend, isReceive]);
  const originTx = minBy(item.txs, (tx) => tx.createdAt);
  const maxGasTx = findMaxGasTx(item?.group?.txs || []);

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

  const isFromRabby = useMemo(() => {
    if (!item.site) return false;
    const { origin } = item.site;
    return origin?.startsWith('chrome-extension://');
  }, [item]);

  const loadTxData = async () => {
    if (!item.txs || item.txs.length <= 0 || !item.rawTx) {
      return;
    }

    const completedTx = item.txs.find((tx) => tx.isCompleted);

    const results = await Promise.all(
      item.txs
        .filter((tx) => !tx.isSubmitFailed)
        .map((tx) =>
          walletOpenapi.getTx(
            item.chain,
            tx.hash,
            Number(tx.rawTx.gasPrice || tx.rawTx.maxFeePerGas || 0)
          )
        )
    );
    let map = {};
    results.forEach(
      ({ code, status, front_tx_count, gas_used, token }, index) => {
        if (!item?.txs?.[index]?.hash) {
          return;
        }
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
          // walletController.completedTransaction({
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
      // onComplete && onComplete();
    } else {
      setTxQueues(map);
    }
  };

  useEffect(() => {
    loadTxData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    reload?.();
  };

  const handleClickCancel = () => {
    setIsShowCancelPopup(true);
  };

  const handleClickSpeedUp = async () => {
    if (!item.rawTx || !canCancel) return;
    const maxGasPrice = Number(
      item.rawTx.gasPrice || item.rawTx.maxFeePerGas || 0
    );
    const gasLevels: GasLevel[] = await walletOpenapi.gasMarket(item.chain);
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)?.price;
    if (!maxGasMarketPrice) return;
    await walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: item.rawTx.from,
          value: item.rawTx.value,
          data: item.rawTx.data,
          nonce: item.rawTx.nonce,
          chainId: item.rawTx.chainId,
          to: item.rawTx.to,
          gasPrice: intToHex(
            Math.round(Math.max(maxGasPrice * 2, maxGasMarketPrice))
          ),
          isSpeedUp: true,
        },
      ],
    });
  };

  const handleOnChainCancel = async () => {
    if (!item.rawTx || !canCancel) return;
    const maxGasPrice = Number(
      item.rawTx.gasPrice || item.rawTx.maxFeePerGas || 0
    );
    const gasLevels: GasLevel[] = await walletOpenapi.gasMarket(item.chain);
    const maxGasMarketPrice = maxBy(gasLevels, (level) => level.price)?.price;
    if (!maxGasMarketPrice) return;
    await walletController.sendRequest({
      method: 'eth_sendTransaction',
      params: [
        {
          from: item.rawTx.from,
          to: item.rawTx.from,
          gasPrice: intToHex(Math.max(maxGasPrice * 2, maxGasMarketPrice)),
          value: '0x0',
          chainId: item.rawTx.chainId,
          nonce: item.rawTx.nonce,
          isCancel: true,
        },
      ],
    });
    reload?.();
  };

  const handleQuickCancel = async () => {
    if (!item.group) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const maxGasTx = findMaxGasTx(item.group.txs);
    if (maxGasTx?.reqId) {
      try {
        await walletController.quickCancelTx({
          reqId: maxGasTx.reqId,
          chainId: maxGasTx.rawTx.chainId,
          nonce: +maxGasTx.rawTx.nonce,
          address: maxGasTx.rawTx.from,
        });
        // reload?.();
        message.success('Canceled');
      } catch (e: any) {
        message.error(e.message);
      }
    }
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

  const projectName = (
    <span>
      {item.protocol?.name ? (
        item.protocol.name
      ) : item.otherAddr ? (
        <NameAndAddress address={item.otherAddr} copyIconClass="icon-copy" />
      ) : (
        ''
      )}
    </span>
  );

  let interAddressExplain;

  if (isCancel) {
    interAddressExplain = 'Canceled Pending';
  } else if (isApprove && item.approve) {
    const approveToken = item.approve?.token;
    const amount = item.approve?.value || 0;

    interAddressExplain = (
      <>
        <div className="tx-explain-title">
          Approve {amount < 1e9 ? amount.toFixed(4) : 'infinite'}{' '}
          {`${getTokenSymbol(approveToken)}`}
        </div>
        <div className="tx-explain-desc">{projectName}</div>
      </>
    );
  } else if (isSend) {
    interAddressExplain = (
      <>
        <div className="tx-explain-title">Send</div>
        <div className="tx-explain-desc">{projectName}</div>
      </>
    );
  } else if (isReceive) {
    interAddressExplain = (
      <>
        <div className="tx-explain-title">Receive</div>
        <div className="tx-explain-desc">{projectName}</div>
      </>
    );
  } else {
    interAddressExplain = (
      <>
        <div className="tx-explain-title">
          {item.name || 'Contract Interaction'}
        </div>
        <div className="tx-explain-desc">{projectName}</div>
      </>
    );
  }

  return (
    <TransactionItemWrapper
      className={classNames({
        pending: isPending,
        completed: isCompleted,
        failed: isFailed,
        scam: isScam,
      })}
    >
      {isScam && <ScamTag>Scam tx</ScamTag>}
      {isFailed && (
        <Tooltip title="Transaction failed">
          <FailedTag className="failed-tag">
            <img
              src="rabby-internal://assets/icons/home/tx-failed.svg"
              className="icon-failed"
            />
          </FailedTag>
        </Tooltip>
      )}
      {isPending && (
        <>
          <PendingTagGroup>
            {item.group ? (
              <TransactionPendingTag
                item={item.group}
                onReBroadcast={handleReBroadcast}
                txRequests={txRequests || {}}
              />
            ) : (
              <PendingTag>
                <img
                  src="rabby-internal://assets/icons/home/tx-pending.svg"
                  className="icon-pending"
                />
                Pending
              </PendingTag>
            )}

            <PendingTooltip timeAt={item.timeAt} />
            <TxHash item={item} />
          </PendingTagGroup>
          <Tooltip
            title={
              canCancel
                ? null
                : 'Cannot speed up or cancel: Not the first pending txn'
            }
            placement="topRight"
            autoAdjustOverflow={false}
          >
            <Actions
              className={classNames({
                disabled: !canCancel,
              })}
            >
              <Tooltip title={canCancel ? 'Speed up' : null}>
                <img
                  src="rabby-internal://assets/icons/home/action-speedup.svg"
                  className="icon-speedup"
                  onClick={handleClickSpeedUp}
                />
              </Tooltip>
              <div className="divider" />
              <Tooltip title={canCancel ? 'Cancel' : null}>
                <img
                  src="rabby-internal://assets/icons/home/action-cancel.svg"
                  className="icon-cancel"
                  onClick={handleClickCancel}
                />
              </Tooltip>
            </Actions>
          </Tooltip>
        </>
      )}
      {isCompleted && (
        <Tooltip
          title="Transaction on chain, decoding data to generate record"
          overlayStyle={{ width: '187px' }}
        >
          <CompletedTag>
            <img
              src="rabby-internal://assets/icons/home/tx-completed.svg"
              className="icon-completed"
            />
            Completed
          </CompletedTag>
        </Tooltip>
      )}
      {!isPending && (
        <>
          <div className="tx-time">{sinceTime(item.timeAt / 1000)}</div>
          <TxHash item={item} />
        </>
      )}
      <TxExplain
        className={classNames('tx-explain', {
          'has-bg': !isCancel && !isSend && !isReceive && iconUrl,
        })}
      >
        <IconWithChain
          iconUrl={
            iconUrl || 'rabby-internal://assets/icons/home/tx-unknown.svg'
          }
          chainServerId={item.chain}
          width="26px"
          height="26px"
          noRound={!isCancel && !isSend && !isReceive}
        />
        <TxExplainInner>{interAddressExplain}</TxExplainInner>
        <TxChange sends={item.sends} receives={item.receives} />
      </TxExplain>
      {item?.site?.origin && !isFromRabby ? (
        <div className="tx-origin">
          Initiate from Dapp:{' '}
          <TransactionWebsite
            origin={item.site?.origin}
            className="tx-dapp-link"
          />
        </div>
      ) : null}
      {isPending && (item?.txs?.length || 0) > 1 && (
        <ChildrenWrapper>
          <div className="tx-history__item--children">
            <div className="pending-detail">
              Pending detail
              <Tooltip
                title="Only one transaction will be completed, and it is almost always the one with the highest gas price"
                autoAdjustOverflow={false}
                overlayStyle={{ maxWidth: '287px' }}
              >
                <img
                  className="icon icon-question-mark"
                  src="rabby-internal://assets/icons/home/question.svg"
                />
              </Tooltip>
            </div>
            {item.txs
              ?.sort((a, b) => b.createdAt - a.createdAt)
              .map((tx, index) => (
                <div
                  className={classNames('tx-history__item--children__item', {
                    active: index === 0,
                  })}
                >
                  <ChildrenTxText tx={tx} originTx={originTx!} />
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
                    className="icon icon-spin"
                    src="rabby-internal://assets/icons/home/tx-pending-1.svg"
                  />
                </div>
              ))}
          </div>
        </ChildrenWrapper>
      )}
      {isPending && (
        <CancelTxPopup
          visible={isShowCancelPopup}
          onClose={() => {
            setIsShowCancelPopup(false);
          }}
          onCancelTx={handleCancelTx}
          tx={maxGasTx}
        />
      )}
    </TransactionItemWrapper>
  );
};

export default TransactionItem;
