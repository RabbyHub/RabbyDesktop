import { sinceTime } from '@/renderer/utils/time';
import dayjs from 'dayjs';
import React from 'react';

export interface Props {
  timeAt: string;
  nonce: number;
}

export const TxItemBasicInfo: React.FC<Props> = ({ timeAt, nonce }) => {
  const time = sinceTime(new Date(timeAt).getTime() / 1000, 'YYYY/MM/DD');

  return (
    <div className="flex flex-col gap-[30px] w-[140px] flex-shrink-0">
      <time className="text-[14px] opacity-60">{time}</time>
      <span className="text-[12px] opacity-30">Nonce: {nonce}</span>
    </div>
  );
};
