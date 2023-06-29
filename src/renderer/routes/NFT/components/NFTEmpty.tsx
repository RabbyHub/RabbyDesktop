import { Empty } from 'antd';
import { useMemo } from 'react';

export const NFTEmpty = ({ id }: { id: string }) => {
  const image = useMemo(() => {
    if (id === 'all') {
      return 'rabby-internal://assets/icons/nft/empty-all.svg';
    }
    return 'rabby-internal://assets/icons/nft/empty-starred.svg';
  }, [id]);

  const desc = useMemo(() => {
    if (id === 'all') {
      return 'No NFT';
    }
    return 'No Statted NFT';
  }, [id]);

  const tip = useMemo(() => {
    if (id === 'all') {
      return '';
    }
    return 'You can select NFT from "All" and add to "Starred"';
  }, [id]);
  return (
    <Empty
      image={image}
      imageStyle={{
        width: 100,
        height: 100,
        margin: '150px auto 0 auto',
      }}
      description={
        <>
          <div className="text-15 font-medium text-white mt-24">{desc}</div>
          <div className="text-13 text-white text-opacity-60 mt-8">{tip}</div>
        </>
      }
    />
  );
};
