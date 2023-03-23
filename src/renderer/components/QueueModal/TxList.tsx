import classNames from 'classnames';
import React from 'react';
import { useSafeQueue } from './useSafeQueue';

export const TxList: React.FC = () => {
  const queue = useSafeQueue();

  console.log(queue);

  return (
    <section className={classNames('flex flex-col', 'border rounded-[8px]')}>
      <div>
        These transactions conflict as they use the same nonce. Executing one
        will automatically replace the other(s).
      </div>
    </section>
  );
};
