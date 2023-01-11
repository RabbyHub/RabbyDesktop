import classNames from 'classnames';
import styled from 'styled-components';
import { CHAINS } from '@debank/common';
import { TokenItem } from '@debank/rabby-api/dist/types';

const TokenWithChainWrapper = styled.div`
  position: relative;
  .token-logo,
  .chain-logo {
    border-radius: 100%;
  }
  .chain-logo {
    width: 16px;
    height: 16px;
    position: absolute;
    right: -6px;
    top: -6px;
  }
  .no-round {
    border-radius: 4px !important;
  }
`;

const TokenWithChain = ({
  token,
  hideConer,
  width = '28px',
  height = '28px',
  noRound = false,
  hideChainIcon = false,
}: {
  token: TokenItem;
  width?: string;
  height?: string;
  hideConer?: boolean;
  noRound?: boolean;
  hideChainIcon?: boolean;
}) => {
  const chainServerId = token.chain;
  const chain = Object.values(CHAINS).find(
    (item) => item.serverId === chainServerId
  );
  return (
    <TokenWithChainWrapper
      className={classNames('token-with-chain', noRound && 'no-round')}
      style={{ width, height }}
    >
      <img
        className={classNames('token-logo', noRound && 'no-round')}
        src={
          token.logo_url ||
          'rabby-internal://assets/icons/common/token-default.svg'
        }
        alt={token.symbol}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon && (!hideConer || chain?.id) && (
        <img
          className="chain-logo"
          src={
            chain?.logo ||
            'rabby-internal://assets/icons/common/token-default.svg'
          }
        />
      )}
    </TokenWithChainWrapper>
  );
};

export const IconWithChain = ({
  chainServerId,
  iconUrl,
  hideConer,
  width = '28px',
  height = '28px',
  noRound = false,
  hideChainIcon = false,
}: {
  iconUrl: string;
  chainServerId: string;
  width?: string;
  height?: string;
  hideConer?: boolean;
  noRound?: boolean;
  hideChainIcon?: boolean;
}) => {
  const chain = Object.values(CHAINS).find(
    (item) => item.serverId === chainServerId
  );
  return (
    <TokenWithChainWrapper
      className={classNames('token-with-chain', noRound && 'no-round')}
      style={{ width, height }}
    >
      <img
        className={classNames('token-logo', noRound && 'no-round')}
        src={iconUrl}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon && (!hideConer || chain?.id) && (
        <img
          className="chain-logo"
          src={
            chain?.logo ||
            'rabby-internal://assets/icons/common/token-default.svg'
          }
        />
      )}
    </TokenWithChainWrapper>
  );
};

export default TokenWithChain;
