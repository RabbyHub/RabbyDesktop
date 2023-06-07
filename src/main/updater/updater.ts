import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

import * as Sentry from '@sentry/electron/main';

import { NsisUpdater, MacUpdater } from 'electron-updater';
import eLog from 'electron-log';

import type { GenericServerOptions } from 'builder-util-runtime';

import { getAppCacheDir } from 'electron-updater/out/AppAdapter';

import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { getAssetPath, getMainBuildInfo } from '../utils/app';

eLog.transports.file.level = 'debug';

const { buildchannel, buildarch: ARCH } = getMainBuildInfo();
const PLATFORM = process.platform;

export function getAppUpdaterURL(): string {
  if (!IS_RUNTIME_PRODUCTION)
    return `https://download.rabby.io/wallet-desktop-updater-test/${PLATFORM}-${ARCH}/`;

  // if you wanna test the effect, set UPDATER_TEST_URL as a valid url, ask your mate for help.
  if (buildchannel !== 'prod' && process.env.UPDATER_TEST_URL) {
    return process.env.UPDATER_TEST_URL;
  }

  const remoteBaseDir =
    buildchannel === 'prod'
      ? 'wallet-desktop'
      : `wallet-desktop-${buildchannel}`;
  return `https://download.rabby.io/${remoteBaseDir}/${PLATFORM}-${ARCH}/`;
}

// keep the same cache dir in `dev-app-update.yml` on dev
const CACHE_DIRNAME = !IS_RUNTIME_PRODUCTION
  ? 'rabby-desktop-dev-updater'
  : 'rabby-desktop-updater';
function cleanCacheDir(baseDir: string) {
  ['./pending'].forEach((p) => {
    const fullpath = path.resolve(baseDir, p);
    if (fs.existsSync(fullpath)) {
      console.log('[cleanCacheDir] will remove', fullpath);
      try {
        fs.rmSync(fullpath, { recursive: true });
      } catch (err) {
        console.warn('[cleanCacheDir] error occured');
        console.error(err);
      }
    }
  });
}

export class AppUpdaterWin32 extends NsisUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: 'generic',
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
      updaterCacheDirName: CACHE_DIRNAME,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive() {
    return true;
  }

  getCacheDir() {
    return path.resolve(getAppCacheDir(), CACHE_DIRNAME);
  }

  cleanDownloadedCache() {
    cleanCacheDir(this.getCacheDir());
  }
}

export class AppUpdaterDarwin extends MacUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: 'generic',
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
      updaterCacheDirName: CACHE_DIRNAME,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive() {
    return true;
  }

  getCacheDir() {
    return path.resolve(getAppCacheDir(), CACHE_DIRNAME);
  }

  cleanDownloadedCache() {
    cleanCacheDir(this.getCacheDir());
  }

  /**
   * @dev chmod -R 777 notify_rabby_installation.app if necessary
   */
  _spawnNotifyInstall() {
    const notifyInstallApp = getAssetPath(
      './scripts/notify_rabby_installation.app'
    );
    child_process.spawn('open', [notifyInstallApp], {});
  }

  _killAllNotifyInstall() {
    try {
      const ret = child_process.execSync(
        `ps aux | grep "notify_rabby_installation" | grep -v grep | wc -l | xargs echo`
      );
      const retStr = ret?.toString();

      if (retStr !== '0') {
        child_process.spawn('killall', ['-9', 'notify_rabby_installation'], {});
      }
    } catch (err) {
      console.warn('[AppUpdaterDarwin] _killAllNotifyInstall error');
      console.error(err);
      Sentry.captureException(err);
    }
  }

  quitAndInstall(): void {
    this._spawnNotifyInstall();
    super.quitAndInstall();
  }
}
