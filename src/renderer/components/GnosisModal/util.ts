import { Chain } from '@debank/common';
import Safe from '@rabby-wallet/gnosis-sdk';
import semver from 'semver-compare';

export const checkAddress = async (address: string, chain: Chain) => {
  const safe = await Safe.getSafeInfo(address, chain.network);
  if (semver(safe.version, '1.1.1') < 0) {
    throw new Error('Version not supported');
  }
  return true;
};
