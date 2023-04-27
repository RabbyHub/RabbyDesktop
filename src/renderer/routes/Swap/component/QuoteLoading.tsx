import { Skeleton } from 'antd';

import IconQuoteLoading from '@/../assets/icons/swap/quote-loading.svg?rc';
import { CEX, DEX } from '../constant';

type QuoteListLoadingProps = {
  fetchedList?: string[];
};

export const QuoteLoading = ({
  logo,
  name,
}: {
  logo: string;
  name: string;
}) => {
  return (
    <div className="flex-1 py-12 px-16 flex item-center rounded-[6px] border-solid border-[0.5px] border-white border-opacity-20">
      <div className="relative flex items-center">
        <img className="w-24 h-24 rounded-1" src={logo} />
        <div className="absolute w-[30px] h-[30px] left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <IconQuoteLoading className="text-[30px]  animate-spin" />
        </div>
      </div>
      <span className="ml-[17px] text-16 font-medium text-white text-opacity-80">
        {name}
      </span>
      <div className="ml-auto mr-[100px] flex item-center">
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
      </div>

      <Skeleton.Input
        active
        style={{ borderRadius: '6px', width: 68, height: 20, opacity: '0.5' }}
      />
    </div>
  );
};

export const QuoteListLoading = ({
  fetchedList: dataList,
}: QuoteListLoadingProps) => {
  return (
    <>
      {Object.entries(DEX).map(([key, value]) => {
        if (dataList && dataList.includes(key)) return null;
        return <QuoteLoading logo={value.logo} key={key} name={value.name} />;
      })}
      {Object.entries(CEX).map(([key, value]) => {
        if (dataList && dataList.includes(key)) return null;
        return <QuoteLoading logo={value.logo} key={key} name={value.name} />;
      })}
    </>
  );
};
