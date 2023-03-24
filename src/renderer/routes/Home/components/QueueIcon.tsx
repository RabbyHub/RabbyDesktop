import { useSafe } from '@/renderer/hooks/rabbyx/useSafe';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import IconQueue from '../../../../../assets/icons/queue/queue.svg?rc';

export const QueueIcon: React.FC = () => {
  const { pendingCount } = useSafe();

  return (
    <div className="relative">
      <div
        className={classNames(
          'flex items-center justify-center',
          'bg-[#FFB020] rounded-full w-[15px] h-[15px]',
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
