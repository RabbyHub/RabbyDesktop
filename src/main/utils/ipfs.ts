import { PromisePool } from '@supercharge/promise-pool';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import path from 'path';
// import { CID } from 'multiformats';

// const loadMultiformats = async () => {
//   console.log('Loading multiformats');
//   // eslint-disable-next-line import/extensions
//   // const { CID } = await import('multiformats');
//   console.log(CID.parse('QmeeFZ6m4SE2xCyRGKdCtdNPMibVw7NyFm5VSo8JPvhPBY'));
// };

export const listIPFSFiles = async (ipfs: IPFSHTTPClient, ipfsPath: string) => {
  const files: string[] = [];
  const stat = await ipfs.files.stat(ipfsPath);
  if (stat.type === 'file') {
    files.push(ipfsPath);
  } else if (stat.type === 'directory') {
    const dir: {
      value: {
        Data: Uint8Array;
        Links: { Name: string; Tsize: number; Hash: string }[];
      };
      remainderPath?: string;
    } = await ipfs.dag.get(stat.cid);

    // eslint-disable-next-line no-restricted-syntax
    for (const entry of dir.value.Links) {
      const fullPath = path.join(ipfsPath, entry.Name);
      // eslint-disable-next-line no-await-in-loop
      const subFiles = await listIPFSFiles(ipfs, fullPath);
      files.push(...subFiles);
    }
  }
  return files;
};

export const downloadIPFSFile = async (
  ipfs: IPFSHTTPClient,
  ipfsPath: string,
  rootPath: string
) => {
  console.log('Downloading', ipfsPath);
  const filePath = path.join(rootPath, ipfsPath);
  const dir = path.dirname(filePath);

  await fs.mkdir(dir, {
    recursive: true,
  });

  const writeStream = createWriteStream(filePath);
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of ipfs.cat(ipfsPath)) {
    await new Promise((resolve, reject) =>
      writeStream.write(chunk, (err) => (err ? reject(err) : resolve(true)))
    );
  }
  writeStream.end();
};

export const downloadIPFSFiles = async (
  ipfs: IPFSHTTPClient,
  ipfsPath: string,
  rootPath: string
) => {
  const files = await listIPFSFiles(ipfs, ipfsPath);
  return PromisePool.for(files)
    .withConcurrency(5)
    .handleError((_error, _index, pool) => {
      pool.stop();
    })
    .process((item) => downloadIPFSFile(ipfs, item, rootPath));
};

export const resolveLocalFile = async (ipfsPath: string, rootPath: string) => {
  const filePath = path.join(rootPath, ipfsPath);
  const stat = await fs.stat(filePath);
  if (stat.isFile()) {
    return fs.readFile(filePath);
  }
  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    const indexStat = await fs.stat(indexPath);
    if (indexStat.isFile()) {
      return fs.readFile(indexPath);
    }
    throw new Error('Directory does not contain index.html');
  }
  throw new Error('Not a file or directory');
};

export const test = async () => {
  const node = create({
    // url: "http://192.168.238.222:9001",
  });

  // const directory =
  //   '/ipfs/bafybeihsbyyzd2f2ri7pwcwuynby3snfrqhn73ontbm6n6tf2wpcd7sxgq/';
  const file = '/ipfs/QmeeFZ6m4SE2xCyRGKdCtdNPMibVw7NyFm5VSo8JPvhPBY';
  // const cid = CID.parse(file);
  // const object = await node.object.get(cid as any);
  // console.log(object);
  await downloadIPFSFiles(node, file, './tmp');
};
// loadMultiformats();
