import { getTokenSymbol } from '@/renderer/utils';
import { findChain } from '@/renderer/utils/chain';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import clsx from 'clsx';
import styled from 'styled-components';
import { TooltipWithMagnetArrow } from '../Tooltip/TooltipWithMagnetArrow';

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
    /* width: 12px; */
    /* height: 12px; */
    position: absolute;
    /* bottom: -2px; */
    /* right: -4px; */
    &.tr {
      top: -2px;
      right: -4px;
    }
    &.br {
      bottom: -2px;
      right: -4px;
    }
  }
  .no-round {
    border-radius: 4px !important;
  }
`;

const IconUnknown = 'rabby-internal://assets/icons/common/token-default.svg';

const TokenWithChain = ({
  token,
  hideConer,
  width = '28px',
  height = '28px',
  noRound = false,
  hideChainIcon = false,
  isShowChainTooltip = false,
  className,
  chainSize = 12,
  chainIconPosition = 'br',
}: {
  token: TokenItem;
  width?: string;
  height?: string;
  hideConer?: boolean;
  noRound?: boolean;
  hideChainIcon?: boolean;
  isShowChainTooltip?: boolean;
  className?: string;
  chainSize?: number;
  chainIconPosition?: 'br' | 'tr';
}) => {
  const chainServerId = token.chain;
  const chain = findChain({
    serverId: chainServerId,
  });
  return (
    <TokenWithChainWrapper
      className={clsx('token-with-chain', noRound && 'no-round', className)}
      style={{ width, height }}
    >
      <img
        className={clsx('token-logo', noRound && 'no-round')}
        src={token.logo_url || IconUnknown}
        alt={getTokenSymbol(token)}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon &&
        (!hideConer || chain?.id) &&
        (isShowChainTooltip ? (
          <TooltipWithMagnetArrow
            title={chain?.name}
            className="rectangle w-[max-content]"
          >
            <img
              className={clsx('chain-logo', chainIconPosition)}
              width={chainSize}
              height={chainSize}
              src={chain?.logo || IconUnknown}
            />
          </TooltipWithMagnetArrow>
        ) : (
          <img
            className={clsx('chain-logo', chainIconPosition)}
            width={chainSize}
            height={chainSize}
            src={chain?.logo || IconUnknown}
          />
        ))}
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
      className={clsx('token-with-chain', noRound && 'no-round')}
      style={{ width, height }}
    >
      <img
        className={clsx('token-logo', noRound && 'no-round')}
        src={iconUrl}
        style={{ width, height, minWidth: width }}
      />
      {!hideChainIcon && (!hideConer || chain?.id) && (
        <img
          className="chain-logo br"
          width={12}
          height={12}
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
