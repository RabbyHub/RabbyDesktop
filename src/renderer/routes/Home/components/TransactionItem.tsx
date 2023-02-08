/* eslint-disable import/no-cycle */
import styled from 'styled-components';
import { Tooltip, Skeleton } from 'antd';
import { intToHex } from 'ethereumjs-util';
import { useMemo } from 'react';
import classNames from 'classnames';
import { GasLevel } from '@debank/rabby-api/dist/types';
import { maxBy } from 'lodash';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import NameAndAddress from '@/renderer/components/NameAndAddress';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { sinceTime } from '@/renderer/utils/time';
import { TransactionDataItem } from '@/isomorphic/types/rabbyx';
import TxChange from './TxChange';

const TransactionItemWrapper = styled.div`
  display: flex;
  padding: 28px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.11);
  position: relative;
  .tx-time {
    position: absolute;
    left: 10px;
    top: 2px;
    font-size: 12px;
    line-height: 14px;
    color: rgba(255, 255, 255, 0.3);
    opacity: 0;
  }
  &.failed {
    padding-top: 30px;
    .tx-explain {
      opacity: 0.3;
    }
    .tx-time {
      left: 29px;
    }
  }
  &.pending {
    padding-top: 38px;
  }
  &.completed {
    .tx-time {
      left: 93px;
    }
  }
  &:nth-last-child(1) {
    border-bottom: none;
  }
  &:hover {
    .tx-time {
      opacity: 1;
    }
  }
`;

const Actions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
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

const CompletedTag = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  background: #686d7c;
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

const FailedTag = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  background: #616675;
  width: 24px;
  border-bottom-right-radius: 4px;
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

const TransactionItem = ({ item }: { item: TransactionDataItem }) => {
  const { isPending, isCompleted, isFailed } = useMemo(() => {
    return {
      isPending: item.status === 'pending',
      isCompleted: item.status === 'completed',
      isFailed: item.status === 'failed',
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

  const handleClickSpeedUp = async () => {
    if (!item.rawTx) return;
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

  const handleClickCancel = async () => {
    if (!item.rawTx) return;
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
  };

  const projectName = (
    <span>
      {item.protocol?.name ? (
        item.protocol.name
      ) : item.otherAddr ? (
        <NameAndAddress address={item.otherAddr} />
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
          {`${approveToken.symbol || approveToken.display_symbol}`}
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
      })}
    >
      {isFailed && (
        <Tooltip title="Transaction failed">
          <FailedTag
            className="icon-failed"
            src="rabby-internal://assets/icons/home/tx-failed.svg"
          />
        </Tooltip>
      )}
      {isPending && (
        <>
          <PendingTag>
            <img
              src="rabby-internal://assets/icons/home/tx-pending.svg"
              className="icon-pending"
            />
            Pending
          </PendingTag>
          <Actions>
            <img
              src="rabby-internal://assets/icons/home/action-speedup.svg"
              className="icon-speedup"
              onClick={handleClickSpeedUp}
            />
            <div className="divider" />
            <img
              src="rabby-internal://assets/icons/home/action-cancel.svg"
              className="icon-cancel"
              onClick={handleClickCancel}
            />
          </Actions>
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
        <div className="tx-time">{sinceTime(item.timeAt / 1000)}</div>
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
    </TransactionItemWrapper>
  );
};

export default TransactionItem;
