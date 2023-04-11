import React from 'react';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import clsx from 'clsx';
import { formatNumber } from '@/renderer/utils/number';
import ChainList from '../../Home/components/ChainList';

export const LeftContainer: React.FC = () => {
  const [selectChainServerId, setSelectChainServerId] = React.useState<
    string | null
  >(null);
  const {
    eth: { displayChainList, totalBalance },
  } = useBundle();

  return (
    <div className="text-white pl-[28px]">
      <div>
        <h2 className={clsx('text-white text-[14px] opacity-70', 'mb-[20px]')}>
          Combined Asset Value
        </h2>
        <div
          className={clsx('text-[46px] font-medium leading-none', 'mb-[23px]')}
        >
          ${formatNumber(totalBalance || 0)}
        </div>
      </div>
      <ChainList
        chainBalances={displayChainList}
        onChange={setSelectChainServerId}
      />
    </div>
  );
};
