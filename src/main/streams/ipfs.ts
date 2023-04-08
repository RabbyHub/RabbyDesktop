import path from 'path';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { initIPFSModule } from '../utils/ipfs';
import { createServerForDir } from '../utils/serve';
import { getAppUserDataPath } from '../utils/store';
import { getIpfsService, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';

onMainWindowReady().then(async () => {
  const rootPath = path.join(getAppUserDataPath(), './local_cache/ipfs-store');

  // TODO: detect port dynamically
  const server = createServerForDir(rootPath, 19900);

  const { IpfsService } = await initIPFSModule();
  const gIpfsService = new IpfsService({
    gateway: 'https://gateway-ipfs.rabby.io:8080',
    rootPath,
  });

  valueToMainSubject('ipfsServiceReady', gIpfsService);
});

handleIpcMainInvoke('download-ipfs', async (_, cid) => {
  try {
    const ipfsService = await getIpfsService();
    await ipfsService.download(cid);
    return {
      success: true,
    };
  } catch (e: any) {
    console.log(e);
    return {
      error: e.message,
      success: false,
    };
  }
});

handleIpcMainInvoke('cancel-download-ipfs', async (_) => {
  const ipfsService = await getIpfsService();
  await ipfsService.cancelDownload();
});
