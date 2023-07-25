import { UsedChain } from '@rabby-wallet/rabby-api/dist/types';
import { CHAINS, Chain } from '@debank/common';

const ALL_CHAINS = Object.values(CHAINS);

/**
 * @description safe find chain
 */
export function findChainByID(chainId: Chain['id']): Chain | null {
  return !chainId
    ? null
    : ALL_CHAINS.find((chain) => chain.id === chainId) || null;
}

/**
 * @description safe find chain by serverId
 */
export function findChainByServerID(chainId: Chain['serverId']): Chain | null {
  return !chainId
    ? null
    : ALL_CHAINS.find((chain) => chain.serverId === chainId) || null;
}

export interface DisplayChainWithWhiteLogo extends UsedChain {
  logo?: string;
  whiteLogo?: string;
}

export const formatChain = (item: UsedChain): DisplayChainWithWhiteLogo => {
  const chainsArray = Object.values(CHAINS);
  const chain = chainsArray.find((i) => i.id === item.community_id);

  return {
    ...item,
    logo: chain?.logo || item.logo_url,
    whiteLogo: chain?.whiteLogo,
  };
};
