import { DisplayChainWithWhiteLogo } from '@/renderer/hooks/useCurrentBalance';
import classNames from 'classnames';
import styled from 'styled-components';
import { useMemo, useState } from 'react';
import { CHAINS_LIST } from '@debank/common';

const ChainListWrapper = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  li {
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.3s;
    margin-right: 4px;
    display: flex;
    align-items: center;
    img {
      width: 20px;
    }
    .chain-name {
      font-weight: 400;
      font-size: 12px;
      line-height: 14px;
      margin-left: 2px;
      margin-right: 6px;
      color: rgba(255, 255, 255, 0.5);
    }
    &.selected {
      opacity: 1;
    }
    &.disabled {
      opacity: 0.5;
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

const ChainList = ({
  chainBalances,
  onChange,
}: {
  chainBalances: DisplayChainWithWhiteLogo[];
  onChange(id: string | null): void;
}) => {
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

  const handleSelectChain = async (serverId: string) => {
    if (serverId === selectChainServerId) {
      setSelectChainServerId(null);
      onChange(null);
      return;
    }
    setSelectChainServerId(serverId);
    await Promise.resolve(); // 强制 onChange 在下一次渲染触发，为了能在 PortfolioView 中取到 UI 变化后的链图标位置和宽度
    onChange(serverId);
  };
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
    <ChainListWrapper>
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
          <img src={item.whiteLogo} />
          {item.id === selectChainServerId && targetChain && (
            <span className="chain-name">{targetChain.name}</span>
          )}
        </li>
      ))}
    </ChainListWrapper>
  );
};

export default ChainList;
