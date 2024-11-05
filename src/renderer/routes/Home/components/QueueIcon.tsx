import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { useGnosisPendingCount } from '@/renderer/hooks/useGnosisPendingCount';
import { useZPopupLayerOnMain } from '@/renderer/hooks/usePopupWinOnMainwin';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import IconQueue from '../../../../../assets/icons/queue/queue.svg?rc';

export const QueueIcon: React.FC = () => {
  const { currentAccount: account } = useCurrentAccount();
  const { data: total, runAsync: fetchPendingCount } = useGnosisPendingCount(
    {
      address: account?.address,
    },
    {
      refreshOnWindowFocus: true,
    }
  );
  const pendingCount = total || 0;
  const { showZSubview } = useZPopupLayerOnMain();

  return (
    <div
      className="relative"
      onClick={() =>
        showZSubview('safe-queue-modal', {}, () => {
          fetchPendingCount();
        })
      }
    >
      <div
        className={classNames(
          'flex items-center justify-center',
          'bg-[#FFB020] rounded-full min-w-[15px] h-[15px] px-[3px]',
          'text-white text-[13px] leading-none font-bold',
          'absolute bottom-[6px] right-[-6px]',
          pendingCount === 0 && 'hidden'
        )}
      >
        <span>{pendingCount}</span>
      </div>
      <Tooltip
        title={pendingCount ? `${pendingCount} in Queue` : 'Queue'}
        overlayInnerStyle={{ padding: '6px 8px' }}
      >
        <IconQueue width="35px" height="35px" />
      </Tooltip>
    </div>
  );
};
