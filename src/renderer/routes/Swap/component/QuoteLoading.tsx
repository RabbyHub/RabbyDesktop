import { Skeleton } from 'antd';
import clsx from 'clsx';

import { CEX, DEX } from '../constant';
import { QuoteLogo } from './QuoteLogo';
import { useSwapSettings } from '../hooks';

type QuoteListLoadingProps = {
  fetchedList?: string[];
  isCex?: boolean;
};

export const QuoteLoading = ({
  logo,
  name,
  isCex = false,
}: {
  logo: string;
  name: string;
  isCex?: boolean;
}) => {
  return (
    <div
      className={clsx(
        'flex-1 py-[13px] px-16 flex item-center rounded-[6px]',
        isCex
          ? ''
          : 'border-solid border-[0.5px] border-white border-opacity-20'
      )}
    >
      <QuoteLogo logo={logo} size={24} isLoading />
      <span className="ml-[17px] text-16 font-medium text-white text-opacity-80 flex items-center ">
        {name}
      </span>
      <div className="ml-auto gap-[100px] flex  justify-between items-center">
        <Skeleton.Input
          active
          block
          style={{
            borderRadius: '6px',
            width: 100,
            height: 20,
            opacity: '0.5',
          }}
        />

        <Skeleton.Input
          active
          style={{ borderRadius: '6px', width: 68, height: 20, opacity: '0.5' }}
        />
      </div>
    </div>
  );
};

export const QuoteListLoading = ({
  fetchedList: dataList,
  isCex,
}: QuoteListLoadingProps) => {
  const { swapViewList } = useSwapSettings();

  return (
    <>
      {Object.entries(isCex ? CEX : DEX).map(([key, value]) => {
        if (
          (dataList && dataList.includes(key)) ||
          swapViewList?.[key as keyof typeof swapViewList] === false
        ) {
          return null;
        }
        return (
          <QuoteLoading
            logo={value.logo}
            key={key}
            name={value.name}
            isCex={isCex}
          />
        );
      })}
    </>
  );
};
