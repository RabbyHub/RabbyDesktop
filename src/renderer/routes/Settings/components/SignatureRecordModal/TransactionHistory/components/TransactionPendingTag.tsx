import { checkIsPendingTxGroup, findMaxGasTx } from '@/isomorphic/tx';
import {
  TransactionGroup,
  TransactionHistoryItem,
} from '@/isomorphic/types/rabbyx';
import { TooltipWithMagnetArrow } from '@/renderer/components/Tooltip/TooltipWithMagnetArrow';
import { sinceTime } from '@/renderer/utils/time';
import { TxRequest } from '@rabby-wallet/rabby-api/dist/types';
import { Popover, Tooltip } from 'antd';
import { MempoolList } from './MempoolList';

const IconDropdown =
  'rabby-internal://assets/icons/signature-record/dropdown.svg';
const IconInfo = 'rabby-internal://assets/icons/signature-record/info.svg';

export const TransactionPendingTag = ({
  item,
  onReBroadcast,
  txRequests,
}: {
  item: TransactionGroup;
  onReBroadcast?(tx: TransactionHistoryItem): void;
  txRequests: Record<string, TxRequest>;
}) => {
  const maxGasTx = findMaxGasTx(item.txs);

  const isPending = checkIsPendingTxGroup(item);

  if (!isPending) {
    return null;
  }

  if (maxGasTx.hash && !maxGasTx.reqId) {
    return (
      <div className="pending flex items-center gap-[6px]">
        <img
          src="rabby-internal://assets/icons/home/tx-pending.svg"
          className="animate-spin"
        />
        Pending
      </div>
    );
  }

  if (maxGasTx.hash) {
    return (
      <Popover
        overlayClassName="mempool-list-popover"
        placement="bottomLeft"
        destroyTooltipOnHide
        content={
          <MempoolList
            tx={maxGasTx}
            onReBroadcast={() => onReBroadcast?.(maxGasTx)}
          />
        }
      >
        <div className="pending flex items-center gap-[6px]">
          <img
            src="rabby-internal://assets/icons/home/tx-pending.svg"
            className="animate-spin"
          />
          Pending: Broadcasted
          <img src={IconDropdown} alt="" />
        </div>
      </Popover>
    );
  }

  const txRequest = maxGasTx?.reqId ? txRequests[maxGasTx.reqId] : null;

  const pushAt = txRequest?.push_at;
  const deadline = Math.round((txRequest?.low_gas_deadline || 0) / 60 / 60);

  if (pushAt) {
    return (
      <div className="pending flex items-center gap-[6px]">
        <img
          src="rabby-internal://assets/icons/home/tx-pending.svg"
          className="animate-spin"
        />
        Pending: Broadcast failed{' '}
        <Tooltip
          overlayClassName="rectangle max-w-[280px] w-[max-content]"
          placement="top"
          title={
            <div className="leading-[18px]">
              Broadcast failed. Last attempt: {sinceTime(pushAt)}{' '}
              <span
                className="cursor-pointer underline whitespace-nowrap"
                onClick={() => {
                  onReBroadcast?.(maxGasTx);
                }}
              >
                Re-broadcast
              </span>
            </div>
          }
        >
          <img src={IconInfo} alt="" />
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="pending flex items-center gap-[6px]">
      <img
        src="rabby-internal://assets/icons/home/tx-pending.svg"
        className="animate-spin"
      />
      Pending: to be broadcasted{' '}
      <Tooltip
        overlayClassName="rectangle max-w-[280px] w-[max-content]"
        arrowPointAtCenter
        placement="top"
        title={
          <div className="leading-[18px]">
            Gas-saving mode: waiting for lower network fees. Max {deadline}h
            wait.
            <span
              className="cursor-pointer underline ml-[30px]"
              onClick={() => {
                onReBroadcast?.(maxGasTx);
              }}
            >
              Broadcast now
            </span>
          </div>
        }
      >
        <img src={IconInfo} alt="" />
      </Tooltip>
    </div>
  );
};
