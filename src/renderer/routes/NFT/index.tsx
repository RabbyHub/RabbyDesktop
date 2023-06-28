import { useMemo, useState } from 'react';
import styled from 'styled-components';
import ModalPreviewNFTItem from '@/renderer/components/ModalPreviewNFTItem';
import { NFTItem } from '@rabby-wallet/rabby-api/dist/types';
import { NFTTabs } from './components/NFTTabs';
import { NFTEmpty } from './components/NFTEmpty';
import { Collection } from './components/Collection';
import { useCollection } from './hooks';
import { CollectionListSkeleton } from './components/CollectionLoading';

const Wrapper = styled.div`
  max-height: calc(100vh - var(--mainwin-headerblock-offset));
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const NFT = () => {
  const [nft, setNft] = useState<NFTItem>();

  const { isLoading, list, starredList, checkStarred, onToggleStar } =
    useCollection();

  const tabs = useMemo(
    () => [
      {
        id: 'all',
        label: 'All',
      },
      {
        id: 'starred',
        label: `Starred(${starredList?.length || 0})`,
      },
    ],
    [starredList?.length]
  );

  const [activeId, setActiveId] = useState(tabs[0].id);

  const displayList = useMemo(() => {
    if (activeId === 'all') {
      return list;
    }
    return starredList;
  }, [activeId, list, starredList]);

  return (
    <Wrapper className="">
      <NFTTabs tabs={tabs} activeId={activeId} onClick={setActiveId} />
      <div className="w-full flex-1 flex flex-col items-center overflow-y-auto  ">
        {isLoading ? (
          <CollectionListSkeleton />
        ) : displayList.length ? (
          <div className="mt-20 space-y-16 pb-20">
            {displayList.map((item) => (
              <Collection
                key={item.id}
                item={item}
                start={checkStarred(item)}
                onPreview={setNft}
                onStart={onToggleStar}
              />
            ))}
          </div>
        ) : (
          <NFTEmpty id={activeId} />
        )}

        {nft && (
          <ModalPreviewNFTItem nft={nft} onCancel={() => setNft(undefined)} />
        )}
      </div>
    </Wrapper>
  );
};
