import path from 'path';
import { create } from 'ipfs-http-client';
import { IpfsService } from '../services/ipfs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getAppUserDataPath } from '../utils/store';
import { onMainWindowReady } from '../utils/stream-helpers';

let gIpfsService: IpfsService;
async function getIpfsService() {
  await onMainWindowReady();
  if (!gIpfsService) {
    gIpfsService = new IpfsService({
      ipfs: create(),
      rootPath: path.join(getAppUserDataPath(), './local_cache/ipfs-store'),
    });
  }

  return gIpfsService;
}

handleIpcMainInvoke('download-ipfs', async (_, ipfsString) => {
  const ipfsService = await getIpfsService();
  const result = await ipfsService.download(ipfsString);
  if (result.errors?.length) {
    return {
      error: result.errors[0]?.message,
      success: false,
    };
  }
  return {
    success: true,
  };
});
