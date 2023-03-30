import { IPFSHTTPClient } from 'ipfs-http-client';
import { downloadIPFSFiles, resolveLocalFile } from '../utils/ipfs';

export class IpfsService {
  private ipfs: IPFSHTTPClient;

  private rootPath: string;

  constructor({ ipfs, rootPath }: { ipfs: IPFSHTTPClient; rootPath: string }) {
    this.ipfs = ipfs;
    this.rootPath = rootPath;
  }

  public async download(ipfsPath: string) {
    return downloadIPFSFiles(this.ipfs, ipfsPath, this.rootPath);
  }

  public async response(ipfsPath: string) {
    return resolveLocalFile(ipfsPath, ipfsPath);
  }
}
