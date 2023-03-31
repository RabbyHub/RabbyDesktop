import styled from 'styled-components';
import RcIconPending from '@/../assets/icons/swap/pending.svg?rc';
import RcIconCompleted from '@/../assets/icons/swap/completed.svg?rc';
import { sinceTime } from '@/renderer/utils/time';
import { ellipsis } from '@/renderer/utils/address';
import { CHAINS, CHAINS_ENUM } from '@debank/common';
import { openExternalUrl } from '@/renderer/ipcRequest/app';

const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  height: 108px;

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
  padding: 0 110px;
  color: rgba(255, 255, 255, 0.6);

  .title {
    color: white;
    font-size: 20px;
    font-weight: medium;
    margin-bottom: 24px;
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
  }
  .tx {
  }
`;
const Transaction = () => {
  const isPending = true;
  const isCompleted = false;
  const time = 1679000000;
  const targetDex = '1inch';
  const txId = '0x5853ed4f26a3fcea565b3fbc698bb19cdf6deb85';
  const chainName = CHAINS[CHAINS_ENUM.ETH].name;

  return (
    <div className="tx">
      <div className="statusBox">
        {isPending && (
          <div className="status">
            <RcIconPending className="text-16 animate-spin mr-6" />
            <span className="pending">Pending</span>
          </div>
        )}
        {isCompleted && (
          <div className="status">
            <RcIconCompleted className="text-16 mr-6" />
            <span>Completed</span>
          </div>
        )}
        <span>{!isPending && sinceTime(time)}</span>
        <span>Aggregator: {targetDex}</span>

        <span className="ml-auto">Gwei: 12 Gwei</span>
        <span>
          {chainName}:{' '}
          <span
            className="addr"
            onClick={() => {
              openExternalUrl(txId);
            }}
          >
            {ellipsis(txId)}
          </span>
        </span>
      </div>
      <div className="txBox">tx details</div>
    </div>
  );
};

export const SwapTransactions = () => {
  return (
    <Wrapper>
      <div className="title">Swap Transactions </div>
      <Transaction />
      <Empty />
    </Wrapper>
  );
};
