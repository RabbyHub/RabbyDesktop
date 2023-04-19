import fsOrigin, { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { ensurePrefix, normalizeIPFSPath } from '@/isomorphic/string';

// import { CarReader } from '@ipld/car';
// import { recursive, walkPath } from 'ipfs-unixfs-exporter';
// import { toHex } from 'multiformats/bytes';
// import { sha256 } from 'multiformats/hashes/sha2';

import { type UnixFSEntry } from 'ipfs-unixfs-exporter';
import { type CID } from 'multiformats';
import nodeFetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { formatProxyServerURL } from '@/isomorphic/url';

import { pipeline } from 'stream';
import { promisify } from 'util';
import { getAppRuntimeProxyConf } from './stream-helpers';
import { getHttpsProxyAgentForRuntime } from '../store/desktopApp';

const streamPipeline = promisify(pipeline);

export const initIPFSModule = async () => {
  const { CarReader } = await import('@ipld/car');
  const { recursive, walkPath } = await import('ipfs-unixfs-exporter');
  const { toHex } = await import('multiformats/bytes');
  const { sha256 } = await import('multiformats/hashes/sha2');
  const { cid: isCid } = await import('is-ipfs');
  console.debug(' ::::::::::::::::::::: initIPFSModule');

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
    rootPath: string,
    signal?: AbortSignal
  ) => {
    const carFolder = path.join(rootPath, 'car');
    fs.mkdir(carFolder, { recursive: true });
    const filePath = path.join(carFolder, `${cidString}.car`);

    const url = `${gateway.replace(/\/$/, '')}/ipfs/${cidString}?format=car`;

    const runtimeProxyConf = await getAppRuntimeProxyConf();
    const res = await nodeFetch(url, {
      method: 'GET',
      agent: getHttpsProxyAgentForRuntime(runtimeProxyConf),
      signal: signal as any,
    });

    if (!res.ok) throw new Error(`unexpected response ${res.statusText}`);

    await streamPipeline(res.body, createWriteStream(filePath));
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
   * @param rootPath
   */
  const extractCarFile = async (cid: string | CID, rootPath: string) => {
    const blockStore = await createBlockStore(
      path.join(rootPath, 'car', `${cid}.car`)
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const file of recursive(cid, blockStore)) {
      const filePath = path.join(rootPath, 'ipfs', file.path);
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

  const verifySingleFile = async (
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
    const localPath = path.join(rootPath, 'ipfs', last.path);
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

  const verifyFile = async (cid: string | CID, rootPath: string) => {
    const blockStore = await createBlockStore(
      path.join(rootPath, 'car', `${cid}.car`)
    );
    // eslint-disable-next-line no-restricted-syntax
    for await (const file of recursive(cid, blockStore)) {
      if (file.type === 'file') {
        const data = [];
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of file.content()) {
          data.push(chunk);
        }
        const hash = await sha256.digest(Buffer.concat(data));
        const localPath = path.join(rootPath, 'ipfs', file.path);
        const localBuffer = await fs.readFile(localPath);
        const localHash = await sha256.digest(localBuffer);
        if (toHex(hash.digest) !== toHex(localHash.digest)) {
          throw new Error(`Local file hash does not match CID ${cid}`);
        }
      }
    }
  };

  const resolveIPNS = async (gateway: string, name: string) => {
    const url = `${gateway.replace(
      /\/$/,
      ''
    )}/api/v0/name/resolve?arg=${name}&recursive=true&nocache=true`;

    const runtimeProxyConf = await getAppRuntimeProxyConf();
    const res = await nodeFetch(url, {
      method: 'POST',
      agent: getHttpsProxyAgentForRuntime(runtimeProxyConf),
    });
    if (!res.ok) {
      throw new Error(`unexpected response ${res.statusText}`);
    }
    const json = await res.json();
    return json.Path as string;
  };

  class IpfsServiceImpl implements IpfsService {
    public gateway: string;

    public rootPath: string;

    public abortController: AbortController = new AbortController();

    constructor({ gateway, rootPath }: { gateway: string; rootPath: string }) {
      this.gateway = gateway;
      this.rootPath = rootPath;
    }

    public cancelDownload() {
      this.abortController?.abort();
      this.abortController = new AbortController();
    }

    public async download(cidString: string) {
      this.cancelDownload();
      if (!isCid(cidString)) {
        throw new Error('Input is not a valid IPFS cid');
      }
      if (await this.isValid(cidString)) {
        console.log('File', cidString, 'is already downloaded');
        return;
      }
      console.log('Downloading car', cidString);
      const start = Date.now();
      await downloadCarFile(
        this.gateway,
        cidString,
        this.rootPath,
        this.abortController?.signal as AbortSignal
      );
      console.log('Downloaded car', cidString, 'in', Date.now() - start, 'ms');
      console.log('extracting', cidString);
      await extractCarFile(cidString, this.rootPath);
      console.log('extracted', cidString);
    }

    // verify local file
    public async verifyFile(cid: string) {
      return verifyFile(cid, this.rootPath);
    }

    public async isValid(cid: string) {
      try {
        await this.verifyFile(cid);
        return true;
      } catch (error) {
        return false;
      }
    }

    public async isExist(cid: string) {
      try {
        await Promise.all([
          fs.access(path.join(this.rootPath, 'car', `${cid}.car`)),
          fs.access(path.join(this.rootPath, 'ipfs', cid)),
        ]);
        return true;
      } catch (error) {
        return false;
      }
    }

    public async removeFile(cid: string) {
      return Promise.all([
        fs.rm(path.join(this.rootPath, 'car', `${cid}.car`), {
          recursive: true,
        }),
        fs.rm(path.join(this.rootPath, 'ipfs', `${cid}`), { recursive: true }),
      ]);
    }

    public resolveFile(filePath: string) {
      let ipfsPath = normalizeIPFSPath(filePath);
      if (ipfsPath.startsWith('/ipfs/')) ipfsPath = `.${ipfsPath}`;
      else if (ipfsPath.startsWith('ipfs/')) ipfsPath = `./${ipfsPath}`;
      ipfsPath = ensurePrefix(ipfsPath, './ipfs/');

      return path.resolve(this.rootPath, ipfsPath);
    }

    public checkFileExist(filePath: string) {
      const filepath = this.resolveFile(filePath);

      if (!fsOrigin.existsSync(filepath)) return null;

      return {
        type: fsOrigin.statSync(filepath).isDirectory() ? 'directory' : 'file',
        filePath,
      };
    }

    public resolveIPNS(ipns: string) {
      return resolveIPNS(this.gateway, ipns);
    }
  }
  return {
    IpfsService: IpfsServiceImpl,
  };
};

export type IpfsService = InstanceType<
  ExtractPromiseValue<ReturnType<typeof initIPFSModule>>['IpfsService']
>;
