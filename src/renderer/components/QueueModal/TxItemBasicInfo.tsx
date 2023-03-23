import { sinceTime } from '@/renderer/utils/time';
import React from 'react';

export interface Props {
  timeAt: number;
  nonce: number;
}

export const TxItemBasicInfo: React.FC<Props> = ({ timeAt, nonce }) => {
  const time = sinceTime(timeAt);

  return (
    <div>
      <time>{time}</time>
      <span>Nonce: {nonce}</span>
    </div>
  );
};
