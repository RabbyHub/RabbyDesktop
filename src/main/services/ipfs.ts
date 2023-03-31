import { ensurePrefix, normalizeIPFSPath } from '@/isomorphic/string';
import { IPFSHTTPClient } from 'ipfs-http-client';
import path from 'path';
import { downloadIPFSFiles, resolveLocalFile } from '../utils/ipfs';

export class IpfsService {
  private ipfs: IPFSHTTPClient;

  private rootPath: string;

  constructor({ ipfs, rootPath }: { ipfs: IPFSHTTPClient; rootPath: string }) {
    this.ipfs = ipfs;
    this.rootPath = rootPath;
  }

  public async download(ipfsPath: string) {
    console.log('Downloading', ipfsPath);
    const start = Date.now();
    const res = await downloadIPFSFiles(this.ipfs, ipfsPath, this.rootPath);
    console.log('Downloaded', ipfsPath, 'in', Date.now() - start, 'ms');
    return res;
  }

  public async response(ipfsPath: string) {
    return resolveLocalFile(ipfsPath, ipfsPath);
  }

  public resolveFile(filePath: string) {
    let ipfsPath = normalizeIPFSPath(filePath);
    if (ipfsPath.startsWith('/ipfs/')) ipfsPath = `.${ipfsPath}`;
    else if (ipfsPath.startsWith('ipfs/')) ipfsPath = `./${ipfsPath}`;
    ipfsPath = ensurePrefix(ipfsPath, './ipfs/');

    return path.resolve(this.rootPath, ipfsPath);
  }
}
