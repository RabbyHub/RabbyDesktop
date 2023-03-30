import { create } from 'ipfs-http-client';
import { IpfsService } from '../services/ipfs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';

const ipfsService = new IpfsService({
  ipfs: create(),
  rootPath: './tmp',
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
