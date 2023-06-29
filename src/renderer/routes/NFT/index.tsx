import { useCallback, useMemo, useState } from 'react';
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
  const [collectionName, setCollectionName] = useState<string>();

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

  const onPreview = useCallback((item: NFTItem, name?: string) => {
    setNft(item);
    setCollectionName(name);
  }, []);

  return (
    <Wrapper>
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
                onPreview={onPreview}
                onStart={onToggleStar}
              />
            ))}
          </div>
        ) : (
          <NFTEmpty id={activeId} />
        )}

        {nft && (
          <ModalPreviewNFTItem
            style={{ marginLeft: 'var(--mainwin-sidebar-w)' }}
            nft={nft}
            collectionName={collectionName}
            onCancel={() => setNft(undefined)}
          />
        )}
      </div>
    </Wrapper>
  );
};
