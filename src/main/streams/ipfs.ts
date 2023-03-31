import path from 'path';
import { create } from 'ipfs-http-client';

import { IpfsService } from '../services/ipfs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getAppUserDataPath } from '../utils/store';
import { getIpfsService, onMainWindowReady } from '../utils/stream-helpers';
import { valueToMainSubject } from './_init';

onMainWindowReady().then(() => {
  const gIpfsService = new IpfsService({
    ipfs: create({
      url: 'http://ipfs.rabby.io:5001',
    }),
    rootPath: path.join(getAppUserDataPath(), './local_cache/ipfs-store'),
  });

  valueToMainSubject('ipfsServiceReady', gIpfsService);
});

handleIpcMainInvoke('download-ipfs', async (_, ipfsString) => {
  try {
    const ipfsService = await getIpfsService();
    const result = await ipfsService.download(ipfsString);
    if (result.errors?.length) {
      return {
        error: result.errors[0]?.message,
        success: false,
      };
    }
  } catch (e: any) {
    return {
      error: e.message,
      success: false,
    };
  }
  return {
    success: true,
  };
});
