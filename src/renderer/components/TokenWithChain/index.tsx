import { getTokenSymbol } from '@/renderer/utils';
import { findChain } from '@/renderer/utils/chain';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import classNames from 'classnames';
import styled from 'styled-components';

// 只是 bundle 里面需要扩展 btc
const EXTENDS_CHAINS = {
  btc: {
    serverId: 'btc',
    logo: 'rabby-internal://assets/icons/bundle/btc-chain.svg',
  },
};

const TokenWithChainWrapper = styled.div`
  position: relative;
  line-height: 0;
  .token-logo,
  .chain-logo {
    border-radius: 100%;
  }
  .chain-logo {
    width: 12px;
    height: 12px;
    position: absolute;
    bottom: -2px;
    right: -4px;
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

  const chain =
    findChain({
      serverId: chainServerId,
    }) ||
    Object.values(EXTENDS_CHAINS).find(
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
        alt={getTokenSymbol(token)}
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
  const chain = findChain({
    serverId: chainServerId,
  });
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
