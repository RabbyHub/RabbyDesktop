// import { IPFS } from 'ipfs-core-types';
import { create } from 'ipfs-http-client';

// export const cid = async (ipfs: IPFS, path: string) => {
//   const stats = await ipfs.files.stat(path);
// };

// export const directory = async (ipfs: IPFS, path: string) => {
//   const files = await ipfs.files.ls(path);
// };

// eslint-disable-next-line @typescript-eslint/no-shadow
// export const resolver = async (ipfs: IPFS, path: string) => {
//   const stats = await ipfs.files.stat(path);
//   if (stats.type === 'directory') {
//     const files = await ipfs.files.ls(path);
//   } else {
//   }
// };

const test = async () => {
  const node = await create();
  const res = await node.dag.resolve(
    '/ipfs/bafybeia3yjtfomact3eefkxbmtkjogrggws4chkvfvi47zp6a6swxu5eh4'
  );
  console.log(res);
};

test();
