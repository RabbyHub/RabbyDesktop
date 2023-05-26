import fs from 'node:fs';
import crypto from 'crypto';

import type { Session } from 'electron';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import appStores from '../store';

/**
 * @description call it only for development plz.
 */
function backupAllStoreData() {
  Object.values(appStores).forEach((store) => {
    const filepath = store.path;
    fs.copyFileSync(filepath, `${filepath}.bak`);
  });
}

export function clearAllStoreData() {
  if (!IS_RUNTIME_PRODUCTION) {
    backupAllStoreData();
  }

  Object.values(appStores).forEach((store) => {
    store.clear();
  });
}

/**
 * @description Removes the contents of the user data directory.
 * This directory is then recreated after re-launching the application.
 */
export function clearAllUserData(session: Session): void {
  session.flushStorageData();
  session.clearStorageData();
}

/**
 * @description Removes directories containing leveldb databases.
 * Each directory is reinitialized after re-launching the application.
 */
export function clearSensitiveDirectories(session: Session): void {
  session.flushStorageData();
  session.clearStorageData({
    storages: ['indexdb', 'localstorage', 'websql'],
  });
}

/**
 * @description same hash algorithm as electron-updater
 *
 * see hashFile in ./node_modules/electron-updater/out/DownloadedUpdateHelper.js
 *
 */
export async function getFileSha512(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash('sha512');
    hash.on('error', reject).setEncoding('base64');

    fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 })
      .on('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(hash, { end: false });

    // stream.on('data', (chunk) => {
    //   hash.update(chunk);
    // });

    // stream.on('end', () => {
    //   const digest = hash.digest('hex');
    //   resolve(digest);
    // });

    // stream.on('error', reject);
  });
}
