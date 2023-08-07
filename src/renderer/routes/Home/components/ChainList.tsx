import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import clsx from 'clsx';
import { Chain, ChainItem } from './ChainItem';

const NoAssetsView = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;

  color: rgba(255, 255, 255, 0.3);
`;

const ChainListWrapper = styled.div`
  row-gap: 24px;
  column-gap: 5px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  @media screen and (max-width: 1440px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const ChainList = ({
  chainBalances,
  onChange,
  updateNonce,
}: {
  chainBalances: Chain[];
  onChange(id: string | null): void;
  updateNonce?: number;
}) => {
  const { currentAccount } = useCurrentAccount();
  const [selectChainServerId, setSelectChainServerId] = useState<null | string>(
    null
  );
  const [currentChainList, setCurrentChainList] = useState<Chain[]>([]);
  const [moreChainList, setMoreChainList] = useState<Chain[]>([]);
  const [showMore, setShowMore] = useState(false);

  const reset = () => {
    setSelectChainServerId(null);
    onChange(null);
  };
  const percentMap = useMemo(() => {
    const total = chainBalances.reduce((acc, item) => acc + item.usd_value, 0);
    return chainBalances.reduce((acc, item) => {
      let num = (item.usd_value / total) * 100;
      if (Number.isNaN(num)) {
        num = 0;
      }
      acc[item.id] = num.toFixed(0);
      return acc;
    }, {} as Record<string, string>);
  }, [chainBalances]);

  const handleSelectChain = async (serverId: string) => {
    if (chainBalances.length <= 1) return;
    if (serverId === selectChainServerId) {
      reset();
      return;
    }
    setSelectChainServerId(serverId);
    await Promise.resolve(); // 强制 onChange 在下一次渲染触发，为了能在 PortfolioView 中取到 UI 变化后的链图标位置和宽度
    onChange(serverId);
  };

  useEffect(() => {
    if (!currentAccount?.address) return;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);

  useEffect(() => {
    const more1List: Chain[] = [];
    const less1List: Chain[] = [];
    chainBalances.forEach((item) => {
      if (Number(percentMap[item.id]) >= 1) {
        more1List.push(item);
      } else {
        less1List.push(item);
      }
    });
    setCurrentChainList(more1List);
    setMoreChainList(less1List);
  }, [percentMap, chainBalances]);

  useEffect(() => {
    return () => {
      setShowMore(false);
    };
  }, [updateNonce]);

  const moreLen = moreChainList.length;

  if (chainBalances.length <= 0) {
    return <NoAssetsView>No assets</NoAssetsView>;
  }

  return (
    <ChainListWrapper
      className={clsx('grid', 'rounded-[6px] bg-[#FFFFFF05]', 'p-[28px]')}
    >
      {currentChainList.map((item) => (
        <ChainItem
          data={item}
          selectChainServerId={selectChainServerId}
          handleSelectChain={handleSelectChain}
          percentMap={percentMap}
          key={item.id}
        />
      ))}
      {showMore ? (
        moreChainList.map((item) => (
          <ChainItem
            data={item}
            selectChainServerId={selectChainServerId}
            handleSelectChain={handleSelectChain}
            percentMap={percentMap}
            key={item.id}
          />
        ))
      ) : (
        <div
          className={clsx(
            'cursor-pointer text-12 underline opacity-70 leading-[32px]',
            {
              hidden: moreLen === 0,
            }
          )}
          onClick={() => {
            setShowMore(true);
          }}
        >
          Unfold {moreLen} chain{moreLen > 1 ? 's' : ''}
        </div>
      )}
    </ChainListWrapper>
  );
};

export default ChainList;
