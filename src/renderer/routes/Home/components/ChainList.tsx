import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { CHAINS_LIST } from '@debank/common';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { formatUsdValue } from '@/renderer/utils/number';
import clsx from 'clsx';

const NoAssetsView = styled.div`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;

  color: rgba(255, 255, 255, 0.3);
`;

interface Chain extends DisplayChainWithWhiteLogo {
  usd_value: number;
}

const ChainList = ({
  chainBalances,
  onChange,
}: {
  chainBalances: Chain[];
  onChange(id: string | null): void;
}) => {
  const { currentAccount } = useCurrentAccount();
  const [selectChainServerId, setSelectChainServerId] = useState<null | string>(
    null
  );
  const targetChain = useMemo(() => {
    if (!selectChainServerId) return null;
    const chain = CHAINS_LIST.find(
      (item) => item.serverId === selectChainServerId
    );
    return chain || null;
  }, [selectChainServerId]);

  const reset = () => {
    setSelectChainServerId(null);
    onChange(null);
  };

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

  if (chainBalances.length <= 0) {
    return <NoAssetsView>No assets</NoAssetsView>;
  }

  return (
    <div
      className={clsx(
        'grid grid-cols-5',
        'gap-[24px]',
        'rounded-[6px] bg-[#FFFFFF05]',
        'p-[28px]'
      )}
    >
      {chainBalances.map((item) => (
        <div
          id={`chain-icon-${item.id}`}
          key={item.id}
          className={clsx('flex space-x-[4px]', 'cursor-pointer', {
            selected: item.id === selectChainServerId,
            'opacity-30':
              selectChainServerId !== null && item.id !== selectChainServerId,
          })}
          onClick={() => handleSelectChain(item.id)}
        >
          <img
            className={clsx('w-[32px] h-[32px]')}
            src={item.logo || item.logo_url}
          />
          <div className="flex flex-col space-y-[5px]">
            <span className="text-[12px] opacity-70">On {item.name}</span>
            <div className="text-[14px]">
              <span>{formatUsdValue(item.usd_value)}</span>
              <span className="text-[12px] opacity-70">1%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChainList;
