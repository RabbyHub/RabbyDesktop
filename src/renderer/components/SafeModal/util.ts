import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { Chain } from '@debank/common';
import semver from 'semver-compare';

export const checkAddress = async (address: string, chain: Chain) => {
  let safe;
  try {
    safe = await walletController.getBasicSafeInfo({
      address,
      networkId: chain.network,
    });
  } catch (e) {
    throw new Error(`This address does not exist on ${chain.name}`);
  }
  if (semver(safe.version, '1.1.1') < 0) {
    throw new Error('Version not supported');
  }
  return true;
};
