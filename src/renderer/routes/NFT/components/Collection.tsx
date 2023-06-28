import ChainIcon from '@/renderer/components/ChainIcon';
import NFTAvatar from '@/renderer/components/NFTAvatar';
import { CHAINS_LIST } from '@debank/common';
import { CollectionList, NFTItem } from '@rabby-wallet/rabby-api/dist/types';

type CollectionProps = {
  start?: boolean;
  onPreview?: (nft: NFTItem) => void;
  item: CollectionList;
  onStart: (item: CollectionList) => void;
};

// const item: CollectionList = {
//   id: '0x5d666f215a85b87cb042d59662a7ecd2c8cc44e6',
//   chain: 'matic',
//   name: 'Galaxy OAT - TJiioVCGDQ',
//   description: null,
//   logo_url:
//     'https://static.debank.com/image/nft_collection/logo_url/galaxy-oat-tjiiovcgdq/2d86d54bf0866443f7fc2a642a320265.png',
//   is_verified: true,
//   credit_score: 1934686.362548698,
//   receive_addr_count: 329437,
//   is_scam: false,
//   is_suspicious: false,
//   is_core: true,
//   floor_price: 0,
//   nft_list: [
//     {
//       id: '6789886d5ea87cdda3ebc26626576456',
//       contract_id: '0x5d666f215a85b87cb042d59662a7ecd2c8cc44e6',
//       inner_id: '11561146',
//       chain: 'matic',
//       name: 'Welcome to Pocket Universe (OAT)',
//       description: '',
//       content_type: 'image',
//       content: '',
//       thumbnail_url: '',
//       total_supply: 1,
//       detail_url:
//         'https://opensea.io/assets/matic/0x5d666f215a85b87cb042d59662a7ecd2c8cc44e6/11561146',
//       attributes: [
//         {
//           trait_type: 'category',
//           value: 'Welcome to Pocket Universe (OAT)',
//         },
//         {
//           display_type: 'date',
//           trait_type: 'birthday',
//           value: 1680833760,
//         },
//       ],
//       collection_id: 'matic:0x5d666f215a85b87cb042d59662a7ecd2c8cc44e6',
//       contract_name: 'Galaxy OAT',
//       is_erc721: true,
//       amount: 1,
//     },
//   ],
// };
export const Collection = (props: CollectionProps) => {
  const { start, onPreview, item, onStart } = props;

  const chain =
    CHAINS_LIST.find((e) => e.serverId === item.chain) || CHAINS_LIST[0];

  const num = item.nft_list.length;

  return (
    <div className="relative w-[600px] p-16 pt-[13px] border border-white border-opacity-20 bg-[#000] bg-opacity-10 rounded-[6px]">
      <img
        onClick={() => onStart(item)}
        className="absolute top-[13px] right-16 w-16 h-16 cursor-pointer"
        src={
          start
            ? 'rabby-internal://assets/icons/nft/starred.svg'
            : 'rabby-internal://assets/icons/nft/star.svg'
        }
      />
      <div className="text-15 font-medium text-white mb-6">
        {item.name}{' '}
        <span className="text-12 text-white text-opacity-70">({num})</span>
      </div>
      <div className="flex items-center text-12 text-white text-opacity-70 gap-6 pb-[13px] border-0 border-b border-white border-opacity-10 border-solid">
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
                onPreview?.(e);
              }}
            />
            // <div
            //   key={e.id}
            //   className="w-60 h-60 rounder-4 overflow-hidden relative group"
            // >
            //   <img
            //     className="w-full h-full"
            //     src={e.thumbnail_url || e.detail_url}
            //     onError={(event) => {
            //       event.currentTarget.src =
            //         'rabby-internal://assets/icons/nft/default-nft.png';
            //     }}
            //   />
            //   {
            //     // e.total_supply > 1 &&
            //     <div className="absolute top-4 right-4 rounded-[2px] bg-[#000] bg-opacity-40 px-[4px] py-[1px] text-white text-opacity-80 text-12 h-16">
            //       x{e.total_supply}
            //     </div>
            //   }
            //   <div className="absolute top-0 left-0 w-full h-full bg-[#000] bg-opacity-5 hidden items-center justify-center cursor-pointer group-hover:flex">
            //     <img
            //       className="w-20 h-20"
            //       src="rabby-internal://assets/icons/nft/view.svg"
            //     />
            //     d
            //   </div>
            // </div>
          );
        })}
      </div>
    </div>
  );
};
