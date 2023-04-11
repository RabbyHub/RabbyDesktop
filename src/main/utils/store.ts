/* eslint-disable no-empty */
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

import Store, { Options as StoreOptions } from 'electron-store';

import {
  APP_NAME,
  IS_RUNTIME_PRODUCTION,
  PERSIS_STORE_PREFIX,
} from '@/isomorphic/constants';
import { safeParse, shortStringify } from '@/isomorphic/json';
import { ensurePrefix, unPrefix } from '@/isomorphic/string';
import { storeLog } from './log';

let gAppUserDataPath = '';
export function getAppUserDataPath() {
  if (!gAppUserDataPath) {
    gAppUserDataPath = app
      .getPath('userData')
      .replace('Electron', APP_NAME)
      .replace('rabby-desktop', APP_NAME);
  }
  return gAppUserDataPath;
}

function getStoreRootPath() {
  return path.resolve(getAppUserDataPath(), './local_data');
}

export function getAppInPkgDir() {
  const dirpath = path.dirname(app.getAppPath());
  let accessible = false;
  try {
    fs.accessSync(dirpath, fs.constants.W_OK);
    accessible = true;
  } catch (err) {}

  return {
    accessible,
    dirpath,
  };
}

export type AppStore<T extends Record<string, any>> = Store<T>;

const MIGRATED = '__migrated';
export function makeStore<T extends Record<string, any>>(
  inputOptions: StoreOptions<T> & { name: string }
) {
  const options = { ...inputOptions };

  const baseName = unPrefix(options.name, PERSIS_STORE_PREFIX);
  const fullName = ensurePrefix(options.name, PERSIS_STORE_PREFIX);
  options.name = fullName;

  const devAndLegacyOptions: StoreOptions<T> = {
    serialize: shortStringify,
    deserialize: (data) => safeParse(data, {}),
    ...options,
    schema: options.schema,
    cwd: getAppUserDataPath(),
    fileExtension: 'json',
  };

  const store = IS_RUNTIME_PRODUCTION
    ? (new Store({
        serialize: shortStringify,
        deserialize: (data) => safeParse(data, {}),
        ...options,
        schema: {
          ...options.schema,
          [MIGRATED]: {
            type: 'boolean',
            default: false,
          },
        } as StoreOptions<T>['schema'],
        cwd: getStoreRootPath(),
        encryptionKey: options.encryptionKey || baseName,
        fileExtension: 'dat',
      }) as AppStore<T>)
    : new Store(devAndLegacyOptions);

  const inPkgDir = getAppInPkgDir();

  // ------------------------ dangerous :start ------------------------
  if (IS_RUNTIME_PRODUCTION && !store.get(MIGRATED)) {
    const inPkgStorePath = path.resolve(inPkgDir.dirpath, `./${fullName}.dat`);
    const devAndLegacyPath = path.resolve(
      devAndLegacyOptions.cwd!,
      `./${fullName}.json`
    );

    if (inPkgDir.accessible && fs.existsSync(inPkgStorePath)) {
      const inPkgStore = new Store<T>({
        ...options,
        schema: {
          ...options.schema,
        } as StoreOptions<T>['schema'],
        cwd: inPkgDir.dirpath,
        encryptionKey: options.encryptionKey || baseName,
        fileExtension: 'dat',
        beforeEachMigration: undefined,
      });

      storeLog(
        `migrate data from in-pkg store ${inPkgStore.path} to store ${store.path}`
      );

      Object.keys({ ...inPkgStore.store }).forEach((k) => {
        if (!store.has(k)) return;
        try {
          store.set(k, inPkgStore.get(k));
        } catch (err) {}
      });

      store.set(MIGRATED, true);
      inPkgStore.clear();

      try {
        fs.rmSync(inPkgStore.path);
        storeLog(`delete inPkgStore ${inPkgStore.path} after migration.`);
      } catch (e) {
        storeLog(
          `failed to delete in-pkg store ${inPkgStore.path} after migration.`
        );
      }
    } else if (fs.existsSync(devAndLegacyPath)) {
      storeLog(
        `migrate data from legacy store ${devAndLegacyPath} to store ${store.path}`
      );

      const runtimeLegacyStore = new Store(devAndLegacyOptions);
      Object.keys({ ...runtimeLegacyStore.store }).forEach((k) => {
        if (!store.has(k)) return;
        try {
          store.set(k, runtimeLegacyStore.get(k));
        } catch (err) {}
      });

      store.set(MIGRATED, true);
      runtimeLegacyStore.clear();
      try {
        fs.rmSync(runtimeLegacyStore.path);
        storeLog(
          `delete runtimeLegacyStore ${runtimeLegacyStore.path} after migration.`
        );
      } catch (e) {
        storeLog(
          `failed to delete in-pkg store ${runtimeLegacyStore.path} after migration.`
        );
      }
    }
  }
  // ------------------------ dangerous :end ------------------------

  return store;
}
