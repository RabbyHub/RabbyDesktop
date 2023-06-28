import React, { useMemo } from 'react';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { walletController, walletOpenapi } from '@/renderer/ipcRequest/rabbyx';
import { CollectionList } from '@rabby-wallet/rabby-api/dist/types';
import { Token } from '@/isomorphic/types/rabbyx';

const wallet = walletController;

export const useCollection = () => {
  const [starredToken, setStarredToken] = React.useState<Token[]>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [list, setList] = React.useState<CollectionList[]>([]);

  const starredList = useMemo(
    () =>
      list.filter((item) =>
        starredToken?.some(
          (starred) =>
            starred.address === item.id && starred.chain === item.chain
        )
      ),
    [starredToken, list]
  );

  const { currentAccount } = useCurrentAccount();

  const currentAddress = currentAccount?.address;

  const checkStarred = React.useCallback(
    (collection: CollectionList) => {
      return starredList?.some(
        (item) => item.id === collection.id && item.chain === collection.chain
      );
    },
    [starredList]
  );

  const fetchData = React.useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const collections = await walletOpenapi.collectionList({
        id,
        isAll: true,
      });
      const filteredCollectionList = collections.filter((item) => item.is_core);

      setList(filteredCollectionList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onToggleStar = React.useCallback(
    async (collection: CollectionList) => {
      if (checkStarred(collection)) {
        await wallet.removeCollectionStarred({
          address: collection.id,
          chain: collection.chain,
        });
      } else {
        await wallet.addCollectionStarred({
          address: collection.id,
          chain: collection.chain,
        });
      }

      await wallet.getCollectionStarred().then(setStarredToken);
    },
    [checkStarred]
  );

  React.useEffect(() => {
    if (currentAddress) {
      setStarredToken([]);
      setList([]);
      fetchData(currentAddress);
      wallet.getCollectionStarred().then(setStarredToken);
    }
  }, [currentAddress, fetchData]);

  return {
    isLoading,
    list,
    starredList,
    onToggleStar,
    checkStarred,
  };
};
