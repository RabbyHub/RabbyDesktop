import fs from 'node:fs';
import crypto from 'crypto';

import { shell, type Session, dialog } from 'electron';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { isAllowedProtocols, safeParseURL } from '@/isomorphic/url';
import appStores from '../store';
import { onMainWindowReady } from './stream-helpers';

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

export function clearStorageDataForOrigin(
  session: Session,
  siteOrigin: string
): void {
  const parseResult = safeParseURL(siteOrigin);

  if (!parseResult?.protocol || !parseResult?.hostname) {
    const errMsg = `invalid siteOrigin: ${siteOrigin}`;

    if (!IS_RUNTIME_PRODUCTION) {
      throw new Error(errMsg);
    } else {
      console.error(errMsg);
    }
    return;
  }

  if (!IS_RUNTIME_PRODUCTION) {
    console.debug(`clearStorageDataForOrigin: ${siteOrigin}`);
  }

  session.flushStorageData();
  session.clearStorageData({
    origin: siteOrigin,
    /** If not specified, clear all storage types. */
    // storages: [
    //   'cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'
    // ]
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

async function alertUnsupportedProtocol(targetURL: string) {
  const DialogButtons = ['OK'] as const;
  const cancleId = DialogButtons.findIndex((x) => x === 'OK');

  const parsedInfo = safeParseURL(targetURL);

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'error',
    title: 'Invalid URL',
    message: `protocol ${parsedInfo?.protocol} is not allowed`,
    defaultId: cancleId,
    cancelId: cancleId,
    noLink: true,
    buttons: DialogButtons as any as string[],
  });
}

/**
 * @description open external url in a safe way, only protocol in whitelist can be opened
 */
export function safeOpenExternalURL(targetURL: string) {
  // TODO: alert user it's not allowed
  if (!isAllowedProtocols(targetURL)) {
    alertUnsupportedProtocol(targetURL);
    return;
  }

  shell.openExternal(targetURL);
}
