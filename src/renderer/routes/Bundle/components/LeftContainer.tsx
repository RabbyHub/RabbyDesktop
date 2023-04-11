import React from 'react';
import { useBundle } from '@/renderer/hooks/useBundle/useBundle';
import clsx from 'clsx';
import { formatNumber } from '@/renderer/utils/number';
import { Skeleton } from 'antd';
import ChainList from '../../Home/components/ChainList';

export const LeftContainer: React.FC = () => {
  const [selectChainServerId, setSelectChainServerId] = React.useState<
    string | null
  >(null);
  const {
    eth: { displayChainList, totalBalance, loading },
  } = useBundle();

  return (
    <div className="text-white pl-[28px]">
      <div>
        <h2
          className={clsx(
            'text-white text-[14px] opacity-70 leading-[17px]',
            'mb-[20px]'
          )}
        >
          Combined Asset Value
        </h2>
        <div
          className={clsx('text-[46px] font-medium leading-none', 'mb-[23px]')}
        >
          {loading ? (
            <Skeleton.Input
              active
              className="w-[234px] h-[46px] rounded-[2px]"
            />
          ) : (
            <span className="block">${formatNumber(totalBalance || 0)}</span>
          )}
        </div>
      </div>
      <div className="mt-[-3px]">
        {loading ? (
          <Skeleton.Input active className="w-full h-[88px] rounded-[2px]" />
        ) : (
          <ChainList
            chainBalances={displayChainList}
            onChange={setSelectChainServerId}
          />
        )}
      </div>
    </div>
  );
};
