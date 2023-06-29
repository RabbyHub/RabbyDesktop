import ChainIcon from '@/renderer/components/ChainIcon';
import NFTAvatar from '@/renderer/components/NFTAvatar';
import { CHAINS_LIST } from '@debank/common';
import { CollectionList, NFTItem } from '@rabby-wallet/rabby-api/dist/types';

type CollectionProps = {
  start?: boolean;
  onPreview?: (nft: NFTItem, name?: string) => void;
  item: CollectionList;
  onStart: (item: CollectionList) => void;
};

export const Collection = (props: CollectionProps) => {
  const { start, onPreview, item, onStart } = props;

  const chain =
    CHAINS_LIST.find((e) => e.serverId === item.chain) || CHAINS_LIST[0];

  const num = item.nft_list.length;

  return (
    <div className="relative w-[600px] p-16 pt-[13px] border border-white border-opacity-20 bg-[#000] bg-opacity-10 rounded-[6px]">
      <div
        className="absolute top-0 right-0 py-[13px] px-[16px] cursor-pointer"
        onClick={() => onStart(item)}
      >
        <img
          className="w-16 h-16"
          src={
            start
              ? 'rabby-internal://assets/icons/nft/starred.svg'
              : 'rabby-internal://assets/icons/nft/star.svg'
          }
        />
      </div>
      <div className="flex items-center gap-4 text-15 font-medium text-white mb-6">
        <span>{item.name} </span>
        <span className="text-12 text-white text-opacity-70">({num})</span>
      </div>
      <div className="flex items-center text-12 text-white text-opacity-70 gap-6 pb-[13px] border-0 border-b border-white border-opacity-5 border-solid">
        <ChainIcon size={'w-14 h-14' as any} chain={chain.enum} />
        <span>
          {chain.name}{' '}
          {item.floor_price
            ? `/ Floor Price: ${item.floor_price} ${chain.nativeTokenSymbol}`
            : null}
        </span>
      </div>
      <div className="flex gap-12 pt-12 flex-wrap">
        {item?.nft_list?.map((e) => {
          return (
            <NFTAvatar
              className="w-60 h-60 rounder-4 overflow-hidden"
              content={e.content}
              type={e.content_type}
              amount={e.amount}
              onPreview={() => {
                onPreview?.(e, item.name);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
