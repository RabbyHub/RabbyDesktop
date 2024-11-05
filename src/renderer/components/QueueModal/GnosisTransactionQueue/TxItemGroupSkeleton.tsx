import { Skeleton } from 'antd';
import classNames from 'classnames';
import React from 'react';

export const TxItemGroupSkeleton: React.FC = () => {
  return (
    <div
      className={classNames(
        'flex flex-col',
        'border border-[#FFFFFF1A] border-solid rounded-[8px] text-white',
        'divide-y'
      )}
    >
      <div
        className={classNames(
          'flex p-[20px] gap-[10px]',
          'border-solid border-0 border-[#FFFFFF1A]',
          'opacity-30'
        )}
      >
        {/* TxItemBasicInfo */}
        <div className="flex flex-col gap-[30px] w-[140px] flex-shrink-0">
          <Skeleton.Input
            active
            className="w-[100px] h-[14px] bg-white rounded-[4px]"
          />
          <Skeleton.Input
            active
            className="w-[100px] h-[12px] bg-white rounded-[4px]"
          />
        </div>
        {/* TxItemExplain */}
        <div className="flex items-center m-0 flex-1">
          <Skeleton.Input
            active
            className="w-[30px] h-[30px] bg-white rounded-[4px] mr-[10px]"
          />
          <Skeleton.Input
            active
            className="w-[100px] h-[15px] bg-white rounded-[4px]"
          />
        </div>
        {/* TxItemConfirmation */}
        <div className="flex flex-col w-[250px] gap-[10px]">
          <Skeleton.Input
            active
            className="w-[100px] h-[14px] bg-white rounded-[4px]"
          />
          <Skeleton.Input
            active
            className="w-[100px] h-[12px] bg-white rounded-[4px]"
          />
          <Skeleton.Input
            active
            className="w-[100px] h-[12px] bg-white rounded-[4px]"
          />
          <Skeleton.Input
            active
            className="w-[100px] h-[12px] bg-white rounded-[4px]"
          />
        </div>
        {/* ButtonGroup */}
        <div className="flex flex-col gap-[20px]">
          <Skeleton.Button
            active
            className="w-[172px] h-[34px] bg-white rounded-[4px]"
          />
          <Skeleton.Button
            active
            className="w-[172px] h-[34px] bg-white rounded-[4px]"
          />
        </div>
      </div>
    </div>
  );
};
