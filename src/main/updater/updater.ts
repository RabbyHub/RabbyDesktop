import { NsisUpdater, MacUpdater } from 'electron-updater';
import eLog from 'electron-log';

import type { GenericServerOptions } from 'builder-util-runtime';

import { IS_RUNTIME_PRODUCTION } from '../../isomorphic/constants';
import { setSessionProxy } from '../utils/appNetwork';
import { getAppRuntimeProxyConf } from '../utils/stream-helpers';

eLog.transports.file.level = 'debug';

const buildchannel = (process as any).buildchannel || 'reg';
const ARCH = (process as any).buildarch || process.arch;
const PLATFORM = process.platform;

function getAppUpdaterURL(): string {
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

export class AppUpdaterWin32 extends NsisUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: 'generic',
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;

    getAppRuntimeProxyConf().then((realProxy) => {
      setSessionProxy(this.netSession, realProxy);
    });
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive() {
    return true;
  }
}

export class AppUpdaterDarwin extends MacUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: 'generic',
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;

    getAppRuntimeProxyConf().then((realProxy) => {
      setSessionProxy(this.netSession, realProxy);
    });
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive() {
    return true;
  }
}
