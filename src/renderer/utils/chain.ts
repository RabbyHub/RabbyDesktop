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

export type { DisplayChainWithWhiteLogo } from '@/isomorphic/wallet/chain';
export { formatChain } from '@/isomorphic/wallet/chain';
