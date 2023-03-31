import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { ensurePrefix, normalizeIPFSPath } from '@/isomorphic/string';
import { type CarReader as ICarReader } from '@ipld/car';
import {
  type recursive as IRecursive,
  type UnixFSEntry,
  type walkPath as IWalkPath,
} from 'ipfs-unixfs-exporter';
import { type CID } from 'multiformats';
import { type toHex as IToHex } from 'multiformats/dist/types/src/bytes';
import { type sha256 as ISha256 } from 'multiformats/hashes/sha2';
import nodeFetch from 'node-fetch';

export const initIPFSModule = async () => {
  /**
   * import modules dynamically
   * 为啥要这样做？
   * 因为 pure esm 模块不能直接被 commonjs 模块引用，所以需要动态引入。
   * 为什么不直接用 await import() 而要用 eval？
   * 因为 await import() 会被 ts 转换成 require()，而 require() 又不能直接引用 esm 模块。
   * 参考：https://stackoverflow.com/questions/70545129/compile-a-package-that-depends-on-esm-only-library-into-a-commonjs-package/70546326#70546326
   */
  // eslint-disable-next-line no-eval
  const { CarReader } = await (eval(`import('@ipld/car')`) as Promise<{
    CarReader: typeof ICarReader;
  }>);
  // eslint-disable-next-line no-eval
  const { recursive, walkPath } = await (eval(
    `import('ipfs-unixfs-exporter')`
  ) as Promise<{
    recursive: typeof IRecursive;
    walkPath: typeof IWalkPath;
  }>);
  // eslint-disable-next-line no-eval
  const { toHex } = await (eval(`import('multiformats/bytes')`) as Promise<{
    toHex: typeof IToHex;
  }>);
  // eslint-disable-next-line no-eval
  const { sha256 } = await (eval(
    `import('multiformats/hashes/sha2')`
  ) as Promise<{
    sha256: typeof ISha256;
  }>);

  const hashes = {
    [sha256.code]: sha256,
  };

  /**
   * download car file from ipfs
   * @param ipfs
   * @param ipfsPath
   * @param rootPath
   */
  const downloadCarFile = async (
    gateway: string,
    cidString: string,
    rootPath: string
  ) => {
    const carFolder = path.join(rootPath, 'car');
    const filePath = path.join(carFolder, `${cidString}.car`);
    fs.mkdir(carFolder, { recursive: true });

    const url = `${gateway.replace(/\/$/, '')}/ipfs/${cidString}?format=car`;
    return new Promise((resolve, reject) => {
      nodeFetch(url, {
        method: 'GET',
      })
        .then((res) => {
          if (res.status > 200) {
            throw new Error(`${res.status} ${res.statusText} ${url}`);
          }
          const dest = createWriteStream(filePath);

          res.body.pipe(dest);
          dest.on('finish', () => {
            resolve(true);
          });
          dest.on('error', (err) => {
            reject(err);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  };

  /**
   * verify block
   * @param cid
   * @param bytes
   * @returns
   */
  async function isValid(cid: CID, bytes: Uint8Array) {
    // todo: add more hash functions
    const hashfn = hashes[cid.multihash.code as keyof typeof hashes];

    if (!hashfn) {
      throw new Error(`Missing hash function for ${cid.multihash.code}`);
    }
    const hash = await hashfn.digest(bytes);
    return toHex(hash.digest) === toHex(cid.multihash.digest);
  }

  /**
   * create blockstore from car file with verify blocks
   * @param cid
   * @param carPath
   * @returns
   */
  const createBlockStore = async (carPath: string) => {
    const carStream = createReadStream(carPath);
    const carReader = await CarReader.fromIterable(carStream);

    return {
      get: async (cid: CID) => {
        // 每次读取一个block，都会去验证一下。
        const res = await carReader.get(cid);
        if (res && !(await isValid(res?.cid, res?.bytes))) {
          throw new Error(`Bad block. Hash does not match CID ${cid}`);
        }
        return res?.bytes || Uint8Array.of();
      },
    };
  };

  /**
   * verify car file and extract it to rootPath
   * @param cid
   * @param carPath
   * @param rootPath
   */
  const extractCarFile = async (
    cid: string | CID,
    carPath: string,
    rootPath: string
  ) => {
    const blockStore = await createBlockStore(carPath);
    // eslint-disable-next-line no-restricted-syntax
    for await (const file of recursive(cid, blockStore)) {
      const filePath = path.join(rootPath, file.path);
      if (file.type === 'directory') {
        await fs.mkdir(filePath, { recursive: true });
      } else {
        const stream = createWriteStream(filePath);
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of file.content()) {
          stream.write(chunk);
        }
        stream.end();
      }
    }
  };

  /**
   * verify car file
   * 1.生成本地文件的时候已经验证过了，这里不需要再验证了。
   * 2.根据cid去verify本地文件的时候，car文件也已经校验了。
   * 3.验证这步是在blockstore里面做的，这里不需要再验证了。
   * 所以这里应该没必要做验证了。
   * @param cid
   * @param carPath
   */
  // const verifyCarFile = async (cid: string | CID, carPath: string) => {};

  const verifyLocalFile = async (
    cid: string | CID,
    carPath: string,
    rootPath: string
  ) => {
    const blockStore = await createBlockStore(carPath);
    const entries: UnixFSEntry[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const entry of walkPath(cid, blockStore)) {
      entries.push(entry);
    }
    const last = entries[entries.length - 1];
    if (!last) {
      throw new Error(`No entries found for ${cid}`);
    }
    const localPath = path.join(rootPath, last.path);
    const localBuffer = await fs.readFile(localPath);
    const localHash = await sha256.digest(localBuffer);

    const data = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of last.content()) {
      data.push(chunk);
    }
    const hash = await sha256.digest(Buffer.concat(data));
    if (toHex(hash.digest) !== toHex(localHash.digest)) {
      throw new Error(`Local file hash does not match CID ${cid}`);
    }
  };

  // const test = async () => {
  //   const node = create({
  //     url: 'http://ipfs.rabby.io:5001',
  //   });

  //   const current = Date.now();
  //   const cid = 'Qmdh9ySaLe5MAwEe7aqNsCK8t5mRx7cAfeJG3kXuKZsC2N';
  //   console.log('downloading');
  //   await downloadCarFile(node, `/ipfs/${cid}`, './temp');
  //   console.log('downloaded');
  //   console.log('extracting');
  //   await extractCarFile(cid, `./temp/${cid}.car`, './temp');
  //   console.log('end', Date.now() - current, 'ms');
  //   console.log('extracted');
  //   console.log('verifying');
  //   await verifyLocalFile(`${cid}`, `./temp/${cid}.car`, './temp');
  //   console.log('done');
  // };

  class IpfsService {
    public gateway: string;

    public rootPath: string;

    constructor({ gateway, rootPath }: { gateway: string; rootPath: string }) {
      this.gateway = gateway;
      this.rootPath = rootPath;
    }

    public async download(cidString: string) {
      const carPath = path.join(this.rootPath, 'car', `${cidString}.car`);
      const extractPath = path.join(this.rootPath, 'ipfs');
      await fs.mkdir(extractPath, { recursive: true });
      console.log('Downloading car', cidString);
      const start = Date.now();
      await downloadCarFile(this.gateway, cidString, this.rootPath);
      console.log('Downloaded car', cidString, 'in', Date.now() - start, 'ms');
      console.log('extracting', cidString);
      await extractCarFile(cidString, carPath, extractPath);
      console.log('extracted', cidString);
    }

    public resolveFile(filePath: string) {
      let ipfsPath = normalizeIPFSPath(filePath);
      if (ipfsPath.startsWith('/ipfs/')) ipfsPath = `.${ipfsPath}`;
      else if (ipfsPath.startsWith('ipfs/')) ipfsPath = `./${ipfsPath}`;
      ipfsPath = ensurePrefix(ipfsPath, './ipfs/');

      return path.resolve(this.rootPath, ipfsPath);
    }
  }
  return {
    IpfsService,
  };
};
