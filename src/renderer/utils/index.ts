import { CHAINS_ENUM, Chain } from '@debank/common';
import { TokenItem } from '@rabby-wallet/rabby-api/dist/types';
import { findChain } from './chain';
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

export const getChain = (chainId?: string) => {
  if (!chainId) {
    return null;
  }
  return findChain({
    serverId: chainId,
  });
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
): Chain | undefined | null {
  const toFallbackEnum: CHAINS_ENUM | null = options?.fallback
    ? typeof options?.fallback === 'boolean'
      ? CHAINS_ENUM.ETH
      : options?.fallback
    : null;
  const toFallbackChain = toFallbackEnum
    ? findChain({ enum: toFallbackEnum })
    : null;

  if (!chainEnum) return toFallbackChain;

  return (
    findChain({
      enum: chainEnum,
    }) || toFallbackChain
  );
}

export const hex2Text = (hex: string) => {
  try {
    return hex.startsWith('0x')
      ? decodeURIComponent(
          hex.replace(/^0x/, '').replace(/[0-9a-f]{2}/g, '%$&')
        )
      : hex;
  } catch {
    return hex;
  }
};

export const getAddressScanLink = (scanLink: string, address: string) => {
  if (/transaction\/_s_/.test(scanLink)) {
    return scanLink.replace(/transaction\/_s_/, `address/${address}`);
  }
  if (/tx\/_s_/.test(scanLink)) {
    return scanLink.replace(/tx\/_s_/, `address/${address}`);
  }
  return scanLink.endsWith('/')
    ? `${scanLink}address/${address}`
    : `${scanLink}/address/${address}`;
};

export const getTxScanLink = (scankLink: string, hash: string) => {
  if (scankLink.includes('_s_')) {
    return scankLink.replace('_s_', hash);
  }
  return scankLink.endsWith('/')
    ? `${scankLink}tx/${hash}`
    : `${scankLink}/tx/${hash}`;
};
