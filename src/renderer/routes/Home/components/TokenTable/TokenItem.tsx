import React from 'react';
import clsx from 'clsx';
import { Image, Tooltip } from 'antd';
import { isNil } from 'lodash';
import { TokenItem as TokenItemProp } from '@rabby-wallet/rabby-api/dist/types';
import { splitNumberByStep } from '@/renderer/utils/number';
import { findChain } from '@/renderer/utils/chain';
import { TCell, TRow } from './Table';

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
        <span className="text-[#F7FAFC] text-13 font-medium leading-[15px]">
          {splitNumberByStep((item.amount || 0)?.toFixed(4))}
        </span>
        <span className="text-[#D3D8E0] text-12 leading-[14px] whitespace-nowrap overflow-ellipsis overflow-hidden">
          {item.symbol}
        </span>
      </div>
    </TCell>
  );
};

const TokenItemPrice: React.FC<Props> = ({ item }) => {
  return (
    <TCell
      className={clsx(
        'py-8 text-[#D3D8E0] text-12 w-1/4',
        'flex flex-col gap-4'
      )}
    >
      <div>${splitNumberByStep((item.price || 0)?.toFixed(2))}</div>
      {isNil(item.price_24h_change) ? null : (
        <div
          className={clsx('font-normal', {
            'text-green': item.price_24h_change > 0,
            'text-red-forbidden': item.price_24h_change < 0,
          })}
        >
          {item.price_24h_change > 0 ? '+' : ''}
          {(item.price_24h_change * 100).toFixed(2)}%
        </div>
      )}
    </TCell>
  );
};

const TokenItemUSDValue: React.FC<Props> = ({ item }) => {
  const price = splitNumberByStep((item.amount * item.price || 0)?.toFixed(2));

  return (
    <TCell className="py-8 text-[#F7FAFC] text-13 font-medium text-right w-1/4">
      {`$${price}` || '<$0.01'}
    </TCell>
  );
};

export const TokenItem: React.FC<Props> = ({ item, style, onClick }) => {
  return (
    <TRow
      onClick={onClick}
      style={style}
      className={clsx(
        'cursor-pointer',
        'rounded-[6px] border border-transparent -my-1 px-[19px] first-of-type:my-0',
        'hover:border-blue-light hover:bg-blue-light hover:bg-opacity-10'
      )}
    >
      <TokenItemAsset item={item} />
      <TokenItemPrice item={item} />
      <TokenItemUSDValue item={item} />
    </TRow>
  );
};
