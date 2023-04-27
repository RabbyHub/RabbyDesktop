import { Skeleton } from 'antd';

import { CEX, DEX } from '../constant';
import { QuoteLogo } from './QuoteLogo';

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
      <QuoteLogo logo={logo} size={24} isLoading />
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
