import { keyBy } from 'lodash';
import { CHAINS, CHAINS_ENUM, Chain } from '@debank/common';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
/**
 *
 * @param origin (exchange.pancakeswap.finance)
 * @returns (pancakeswap)
 */
export const getOriginName = (origin: string) => {
  const matches = origin.replace(/https?:\/\//, '').match(/^([^.]+\.)?(\S+)\./);

  return matches ? matches[2] || origin : origin;
};

export const hashCode = (str: string) => {
  if (!str) return 0;
  let hash = 0;
  let i: number;
  let chr: number;
  let len: number;

  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + chr;
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const chainsDict = keyBy(CHAINS, 'serverId');
export const getChain = (chainId?: string) => {
  if (!chainId) {
    return null;
  }
  return chainsDict[chainId];
};

// 临时放在这里，因为 token 里会有循环依赖
export const getTokenSymbol = (token?: TokenItem) => {
  if (!token) return '';

  return token.display_symbol || token.symbol || token.optimized_symbol || '';
};

/**
 * @description safe find chain, if not found, return fallback(if provided) or null
 */
export function findChainByEnum(
  chainEnum?: CHAINS_ENUM | string,
  options?: {
    fallback?: true | CHAINS_ENUM;
  }
): Chain | null {
  const toFallbackEnum: CHAINS_ENUM | null = options?.fallback
    ? typeof options?.fallback === 'boolean'
      ? CHAINS_ENUM.ETH
      : options?.fallback
    : null;
  const toFallbackChain = toFallbackEnum ? CHAINS[toFallbackEnum] : null;

  if (!chainEnum) return toFallbackChain;

  return CHAINS[chainEnum as unknown as CHAINS_ENUM] || toFallbackChain;
}
