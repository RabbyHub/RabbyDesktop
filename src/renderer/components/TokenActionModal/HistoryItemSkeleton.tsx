import { Skeleton } from 'antd';
import clsx from 'clsx';

export const HistoryItemSkeleton = () => {
  return (
    <div
      className={clsx(
        'border border-solid rounded-[6px] border-[#FFFFFF1A]',
        'p-[12px]'
      )}
    >
      <div
        className={clsx(
          'flex justify-between w-full',
          'text-[#BABEC5] text-12',
          'mb-12'
        )}
      >
        <Skeleton.Input active className="h-[14px] rounded" />
        <Skeleton.Input active className="h-[14px] rounded" />
      </div>
      <div className="flex justify-between">
        <div className="flex gap-[8px] items-center">
          <Skeleton.Input active className="h-[28px] w-[28px] rounded" />
          <div className="gap-[4px] flex flex-col">
            <Skeleton.Input active className="h-[14px] w-[30px] rounded" />
            <Skeleton.Input active className="h-[14px] w-[80px] rounded" />
          </div>
        </div>

        <div className="gap-[4px] flex flex-col">
          <Skeleton.Input active className="h-[14px] w-[80px] rounded" />
          <Skeleton.Input active className="h-[14px] w-[80px] rounded" />
        </div>
      </div>
    </div>
  );
};
