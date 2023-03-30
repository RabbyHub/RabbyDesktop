import { app } from 'electron';
import { create } from 'ipfs-http-client';
import path from 'path';
import { IpfsService } from '../services/ipfs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

const ipfsService = new IpfsService({
  ipfs: create(),
  rootPath: path.join(app.getPath('userData'), 'ipfs-store'),
});

handleIpcMainInvoke('download-ipfs', async (_, ipfsString) => {
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
