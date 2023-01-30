/* eslint-disable import/no-cycle */
import styled from 'styled-components';
import { useMemo } from 'react';
import classNames from 'classnames';
import { IconWithChain } from '@/renderer/components/TokenWithChain';
import NameAndAddress from '@/renderer/components/NameAndAddress';
import { TransactionDataItem } from './Transactions';
import TxChange from './TxChange';

const TransactionItemWrapper = styled.div`
  display: flex;
  padding: 28px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.11);
  position: relative;
  &.failed {
    padding-top: 30px;
    .tx-explain {
      opacity: 0.3;
    }
  }
  &.pending {
    padding-top: 38px;
  }
  &:nth-last-child(1) {
    border-bottom: none;
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
  .tx-explain-desc {
    margin-top: 2px;
  }
`;

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
  }, [item]);

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
      <div className="tx-explain-title">
        Approve {amount < 1e9 ? amount.toFixed(4) : 'infinite'}{' '}
        {`${approveToken.symbol || approveToken.display_symbol} for `}
        {projectName}
      </div>
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
        <FailedTag
          className="icon-failed"
          src="rabby-internal://assets/icons/home/tx-failed.svg"
        />
      )}
      {isPending && (
        <PendingTag>
          <img
            src="rabby-internal://assets/icons/home/tx-pending.svg"
            className="icon-pending"
          />
          Pending
        </PendingTag>
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
