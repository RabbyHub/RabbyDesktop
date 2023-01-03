import fs from 'node:fs';
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
