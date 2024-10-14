import { findChain } from '@/renderer/utils/chain';
import { splitNumberByStep } from '@/renderer/utils/number';
import { TokenItem as TokenItemProp } from '@rabby-wallet/rabby-api/dist/types';
import { Image, Tooltip } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { TCell, TRow } from '../TokenTable/Table';

const IconUnknown = 'rabby-internal://assets/icons/common/token-default.svg';

export interface Props {
  item: TokenItemProp;
  // eslint-disable-next-line react/no-unused-prop-types
  style?: React.CSSProperties;
  // eslint-disable-next-line react/no-unused-prop-types
  onClick?: () => void;
}

const TokenItemAsset: React.FC<Props> = ({ item }) => {
  const chain = findChain({
    serverId: item.chain,
  });
  return (
    <TCell className="py-8 flex gap-12 w-1/2 items-center">
      <div className="relative">
        <Image
          className="w-24 h-24 rounded-full"
          src={item.logo_url || IconUnknown}
          alt={item.symbol}
          fallback={IconUnknown}
          preview={false}
        />
        <Tooltip title={chain?.name} className="rectangle w-[max-content]">
          <img
            className="w-14 h-14 absolute right-[-2px] top-[-2px] rounded-full"
            src={chain?.logo || IconUnknown}
            alt={item.chain}
          />
        </Tooltip>
      </div>
      <div className="flex flex-col gap-4 overflow-hidden">
        <span className="text-[#D3D8E0] text-12 leading-[14px] whitespace-nowrap overflow-ellipsis overflow-hidden">
          {item.symbol}
        </span>
      </div>
    </TCell>
  );
};

const TokenItemAmount: React.FC<Props> = ({ item }) => {
  const amount = splitNumberByStep((item.amount || 0)?.toFixed(4));

  return (
    <TCell className="py-8 text-[#F7FAFC] text-13 font-medium text-right w-1/2">
      {amount}
    </TCell>
  );
};

export const CustomTestnetTokenItem: React.FC<Props> = ({
  item,
  style,
  onClick,
}) => {
  return (
    <TRow
      onClick={onClick}
      style={style}
      className={clsx(
        'cursor-pointer h-[52px]',
        'rounded-[6px] border border-transparent -my-1 px-[19px] first-of-type:my-0',
        'hover:border-blue-light hover:bg-blue-light hover:bg-opacity-10'
      )}
    >
      <TokenItemAsset item={item} />
      <TokenItemAmount item={item} />
    </TRow>
  );
};
