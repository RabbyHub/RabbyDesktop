import { DisplayChainWithWhiteLogo } from '@/renderer/utils/chain';
import classNames from 'classnames';
import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { CHAINS_LIST } from '@debank/common';
import { useCurrentAccount } from '@/renderer/hooks/rabbyx/useAccount';
import { formatUsdValue } from '@/renderer/utils/number';

const ChainListWrapper = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  li {
    cursor: pointer;
    transition: opacity 0.3s;
    margin-right: 4px;
    display: flex;
    align-items: center;
    margin-right: 8px;
    margin-bottom: 18px;
    font-weight: 500;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    .chain-logo {
      width: 16px;
      margin-right: 6px;
    }
    &.selected {
      opacity: 1;
    }
    &.disabled {
      opacity: 0.2;
    }
    &:nth-last-child(1) {
      margin-right: 0;
    }
  }
`;

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

  if (chainBalances.length === 1) {
    return (
      <ChainListWrapper>
        <li>
          <img src={chainBalances[0].whiteLogo} />
          <span className="chain-name">{chainBalances[0].name}</span>
        </li>
      </ChainListWrapper>
    );
  }

  return (
    <ChainListWrapper id="chain-list">
      {chainBalances.map((item) => (
        <li
          id={`chain-icon-${item.id}`}
          key={item.id}
          className={classNames({
            selected: item.id === selectChainServerId,
            disabled:
              selectChainServerId !== null && item.id !== selectChainServerId,
          })}
          onClick={() => handleSelectChain(item.id)}
        >
          <img className="chain-logo" src={item.logo || item.logo_url} />
          {formatUsdValue(item.usd_value)}
        </li>
      ))}
    </ChainListWrapper>
  );
};

export default ChainList;
