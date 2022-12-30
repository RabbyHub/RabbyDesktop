import { CHAINS_ENUM } from '@debank/common';
import { permissionService } from './rabbyx';

export async function makeSureDappAddedToConnectedSite(dappInfo: IDapp) {
  const existed = await permissionService.getConnectedSite(dappInfo.origin);

  if (!existed) {
    await permissionService.addConnectedSite(
      dappInfo.origin,
      dappInfo.alias,
      dappInfo.faviconUrl!,
      CHAINS_ENUM.ETH,
      false
    );
  } else {
    await permissionService.updateConnectSite(
      dappInfo.origin,
      {
        isConnected: true,
      },
      true
    );
  }

  return permissionService.getConnectedSite(dappInfo.origin);
}
