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

const isDarwin = process.platform === 'darwin';
const isWin32 = process.platform === 'win32';

export function getAppUserDataPath() {
  return app.getPath('userData').replace('Electron', APP_NAME);
}

const IS_VARY_LOCALDATA = isDarwin && IS_RUNTIME_PRODUCTION;
export function getLocalDataPath() {
  if (IS_VARY_LOCALDATA) {
    return path.dirname(app.getAppPath());
  }

  return getAppUserDataPath();
}

export type AppStore<T extends Record<string, any>> = Store<T>;

const MIGRATED = '__migrated';
export function makeStore<T extends Record<string, any>>(
  inputOptions: StoreOptions<T> & { name: string }
) {
  const options = { ...inputOptions };

  const baseName = unPrefix(options.name, PERSIS_STORE_PREFIX);
  options.name = ensurePrefix(options.name, PERSIS_STORE_PREFIX);

  const store = new Store({
    ...options,
    schema: {
      ...options.schema,
      [MIGRATED]: {
        type: 'boolean',
        default: false,
      },
    } as StoreOptions<T>['schema'],
    cwd: getLocalDataPath(),
    ...(IS_RUNTIME_PRODUCTION
      ? {
          encryptionKey: options.encryptionKey || baseName,
          fileExtension: 'dat',
          ...(isWin32 && {
            cwd: path.resolve(getLocalDataPath(), './local_data'),
          }),
        }
      : {
          fileExtension: 'json',
        }),
  }) as AppStore<T>;

  const $rawStore = !IS_RUNTIME_PRODUCTION
    ? store
    : new Store<T>({
        ...options,
        schema: {
          ...options.schema,
        } as StoreOptions<T>['schema'],
        cwd: getAppUserDataPath(),
        serialize: shortStringify,
        deserialize: (data) => safeParse(data, {}),
        fileExtension: 'json',
        encryptionKey: undefined,
        beforeEachMigration: undefined,
      });

  // ------------------------ dangerous :start ------------------------
  if (IS_RUNTIME_PRODUCTION && store !== $rawStore && !store.get(MIGRATED)) {
    storeLog(
      `migrate data from rawStore ${$rawStore.path} to store ${store.path}`
    );

    Object.keys({ ...$rawStore.store }).forEach((k) => {
      if (!store.has(k)) return;

      store.set(k, $rawStore.get(k));
    });

    store.set(MIGRATED, true);
    $rawStore.clear();

    try {
      fs.rmSync($rawStore.path);
      storeLog(`delete rawStore ${$rawStore.path} after migration.`);
    } catch (e) {
      storeLog(`failed to delete rawStore ${$rawStore.path} after migration.`);
    }
  }
  // ------------------------ dangerous :end ------------------------

  return store;
}
