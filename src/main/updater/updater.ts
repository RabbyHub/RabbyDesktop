import { NsisUpdater, MacUpdater } from "electron-updater"
import eLog from "electron-log";

import type { GenericServerOptions } from "builder-util-runtime";

eLog.transports.file.level = "debug"

import { IS_RUNTIME_PRODUCTION } from "../../isomorphic/constants";

function getAppUpdaterURL (): string {
  // if you wanna test the effect, set UPDATER_TEST_URL as a valid url, ask your mate for help.
  if (process.env.UPDATER_TEST_URL) {
    return process.env.UPDATER_TEST_URL;
  }

  if (!IS_RUNTIME_PRODUCTION)
    return `https://download.rabby.io/wallet-desktop-updater-test/${process.platform === 'win32' ? 'win32' : 'mac'}/`;

  return `https://download.rabby.io/wallet-desktop/${process.platform === 'win32' ? 'win32' : 'mac'}/`;
}

export class AppUpdaterWin32 extends NsisUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: "generic",
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive () {
    return true;
  }
}


export class AppUpdaterDarwin extends MacUpdater {
  constructor(options?: GenericServerOptions) {
    super({
      provider: "generic",
      url: getAppUpdaterURL(),
      ...options,
      logger: eLog,
    } as GenericServerOptions);

    // disable autoDownload, manually call `this.downloadUpdate(cancellationToken)` and `new (require('builder-util-runtime').CancellationToken)()` instead
    this.autoDownload = false;
  }

  // always enable updater, even in development mode, because we want customize the update behavior
  // see more details on `node_modules/electron-updater/out/AppUpdater.js`
  isUpdaterActive () {
    return true;
  }
}
