import { DisplayChainWithWhiteLogo } from '@/renderer/hooks/useCurrentBalance';
import classNames from 'classnames';
import styled from 'styled-components';
import { useState } from 'react';

const ChainListWrapper = styled.ul`
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
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

      color: rgba(255, 255, 255, 0.5);
    }
    &.selected {
      opacity: 1;
    }
    &.disabled {
      opacity: 0.5;
    }
  }
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

  const handleSelectChain = (serverId: string) => {
    if (serverId === selectChainServerId) {
      setSelectChainServerId(null);
      onChange(null);
      return;
    }
    setSelectChainServerId(serverId);
    onChange(serverId);
  };
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
          key={item.id}
          className={classNames({
            selected: item.id === selectChainServerId,
            disabled:
              selectChainServerId !== null && item.id !== selectChainServerId,
          })}
          onClick={() => handleSelectChain(item.id)}
        >
          <img src={item.whiteLogo} />
        </li>
      ))}
    </ChainListWrapper>
  );
};

export default ChainList;
