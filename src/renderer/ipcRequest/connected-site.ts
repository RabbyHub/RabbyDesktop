import { CHAINS_ENUM } from '@debank/common';
import { permissionService } from './rabbyx';

export async function makeSureDappAddedToConnectedSite(
  dappInfo: IDapp,
  updateExisted = true
) {
  const existed = await permissionService.getConnectedSite(dappInfo.origin);

  if (!existed) {
    await permissionService.addConnectedSite(
      dappInfo.origin,
      dappInfo.alias,
      dappInfo.faviconUrl!,
      CHAINS_ENUM.ETH,
      false
    );
  } else if (updateExisted) {
    await permissionService.updateConnectSite(
      dappInfo.origin,
      {
        isConnected: true,
        isTop: false,
      },
      true
    );
  }

  return permissionService.getConnectedSite(dappInfo.origin);
}
