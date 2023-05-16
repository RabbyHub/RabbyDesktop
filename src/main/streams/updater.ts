import { app, dialog, shell, net } from 'electron';
import logger from 'electron-log';
import * as Sentry from '@sentry/electron/main';
import type { UpdateDownloadedEvent } from 'electron-updater/out/main';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import { getOptionProxyForAxios } from '../store/desktopApp';
import { getFileSha512 } from '../utils/security';
import {
  AppUpdaterWin32,
  AppUpdaterDarwin,
  getAppUpdaterURL,
} from '../updater/updater';
import { IS_APP_PROD_BUILD } from '../utils/app';
import { setSessionProxy } from '../utils/appNetwork';
import { fetchText } from '../utils/fetch';
import {
  handleIpcMainInvoke,
  onIpcMainEvent,
  onIpcMainInternalEvent,
  onceIpcMainInternalEvent,
} from '../utils/ipcMainEvents';
import { getBindLog } from '../utils/log';
import {
  getAppRuntimeProxyConf,
  onMainWindowReady,
} from '../utils/stream-helpers';

const log = getBindLog('updater', 'bgGrey');

async function getReleaseNote(version: string) {
  const releaseNoteURLs = IS_APP_PROD_BUILD
    ? {
        markdown: `https://download.rabby.io/cdn-config/release_notes/${version}.md`,
      }
    : {
        markdown: `https://download.rabby.io/cdn-config-pre/release_notes/${version}.md`,
      };

  return fetchText(releaseNoteURLs.markdown, {
    proxy: getOptionProxyForAxios(),
  }).catch(() => ''); // TODO: report error
}

let gAutoUpdater: AppUpdaterWin32 | AppUpdaterDarwin;

const downloadState = {
  downloadP: null as null | Promise<any>,
  checker: null as null | import('electron-updater/out/main').UpdateCheckResult,
};

function resetDownload() {
  downloadState.downloadP = null;
  downloadState.checker = null;
}

async function getAutoUpdater() {
  // TODO: use better custom event 'app-setup'
  await app.whenReady();

  if (!gAutoUpdater) {
    if (process.platform === 'darwin') {
      gAutoUpdater = new AppUpdaterDarwin();
    } else {
      gAutoUpdater = new AppUpdaterWin32();
    }

    const realProxy = await getAppRuntimeProxyConf();
    if (realProxy.proxyType !== 'none') {
      setSessionProxy(gAutoUpdater.netSession, realProxy);
    }

    // gAutoUpdater.on('checking-for-update', () => {
    //   log('gAutoUpdater:: checking-for-update', 'checking-for-update');
    // });
    // gAutoUpdater.on('update-available', (info) => {
    //   log('gAutoUpdater:: update-available', info);
    // });
    // gAutoUpdater.on('update-not-available', (info) => {
    //   log('gAutoUpdater:: update-not-available', info);
    // });
    // gAutoUpdater.on('update-cancelled', (info) => {
    //   log('gAutoUpdater:: update-cancelled', info);
    // });
  }

  return gAutoUpdater;
}

async function alertInsecureUpdatePackage() {
  const DialogButtons = ['OK', 'To Official Site'] as const;
  const cancleId = DialogButtons.findIndex((x) => x === 'OK');
  const confirmId = DialogButtons.findIndex((x) => x === 'To Official Site');

  const mainWin = await onMainWindowReady();
  const result = await dialog.showMessageBox(mainWin.window, {
    type: 'error',
    title: 'Insecure Update Source',
    message: 'Update validation failed',
    defaultId: confirmId,
    cancelId: cancleId,
    noLink: true,
    buttons: DialogButtons as any as string[],
  });

  if (result.response === confirmId) {
    shell.openExternal('https://rabby.io/?platform=desktop');
  }
}

onIpcMainEvent('check-if-new-release', async (event, reqid) => {
  const autoUpdater = await getAutoUpdater();

  autoUpdater.once('update-available', async (info) => {
    event.reply('check-if-new-release', {
      reqid,
      ...(info
        ? {
            hasNewRelease: true,
            releaseVersion: info.version,
            releaseNote: await getReleaseNote(info.version),
          }
        : {
            hasNewRelease: false,
            releaseVersion: null,
            releaseNote: null,
          }),
    });
  });
  autoUpdater.once('update-not-available', (info) => {
    event.reply('check-if-new-release', {
      reqid,
      hasNewRelease: false,
      releaseVersion: null,
      releaseNote: null,
    });
  });

  await autoUpdater.checkForUpdates();
});

function isUnsignedPkg(err?: any) {
  return (
    err?.code.includes('ERR_UPDATER_INVALID_SIGNATURE') ||
    err?.message.includes('not signed') ||
    !!err?.SignerCertificate
  );
}

const verifyState: {
  downloadedFileAbsPath: string | UpdateDownloadedEvent['downloadedFile'];
  expectedSha512: string;
} = {
  downloadedFileAbsPath: '',
  expectedSha512: '',
};

handleIpcMainInvoke('check-download-availble', async () => {
  if (!net.isOnline()) {
    return { error: null, isValid: false, downloadURL: '' };
  }

  const autoUpdater = await getAutoUpdater();
  const checker = await autoUpdater.checkForUpdates();
  downloadState.checker = checker;

  if (!checker) {
    return { error: null, isValid: false, downloadURL: '' };
  }

  const filePath = checker.updateInfo.files[0]?.url || checker.updateInfo.path;
  const downloadURL = `${getAppUpdaterURL()}/${filePath}`;

  return { error: null, isValid: !!checker, downloadURL };
});

onIpcMainEvent('start-download', async (event, reqid) => {
  const autoUpdater = await getAutoUpdater();
  const checker = await autoUpdater.checkForUpdates();
  if (!checker) return;

  downloadState.checker = checker;

  if (IS_RUNTIME_PRODUCTION) {
    autoUpdater.cleanDownloadedCache();
  }

  // autoUpdater
  event.reply('start-download', { reqid });

  autoUpdater.on('download-progress', (info) => {
    log('autoUpdater:: download-progress', info);

    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: info,
        isEnd: false,
      },
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log('autoUpdater:: update-downloaded', info);
    verifyState.downloadedFileAbsPath = info.downloadedFile;
    verifyState.expectedSha512 = info.files[0]?.sha512;

    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: null,
        isEnd: true,
      },
    });
  });

  if (!downloadState.downloadP) {
    downloadState.downloadP = autoUpdater.downloadUpdate(
      checker.cancellationToken
    );
  }

  let downloadFailed = true;
  try {
    // // leave here to test download error
    // if (!IS_RUNTIME_PRODUCTION) {
    //   throw new Error('not signed');
    // }
    await downloadState.downloadP;
    downloadFailed = false;
  } catch (err: any) {
    console.warn('updater download err:');
    console.error(err);
    checker.cancellationToken?.cancel();
    autoUpdater.cleanDownloadedCache();

    if (process.platform === 'win32' && isUnsignedPkg(err)) {
      log('autoUpdater:: getCacheDir', autoUpdater.getCacheDir());
      alertInsecureUpdatePackage();
    }
  } finally {
    resetDownload();
    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: null,
        isEnd: true,
        downloadFailed,
      },
    });
  }
});

onIpcMainEvent('quit-and-upgrade', async (event, reqid) => {
  const autoUpdater = await getAutoUpdater();
  log('autoUpdater:: quit-and-upgrade', reqid);

  event.reply('quit-and-upgrade', { reqid });

  autoUpdater.quitAndInstall();
});

handleIpcMainInvoke('get-release-note', async (event, version) => {
  version = version || app.getVersion();

  return {
    error: null,
    result: await getReleaseNote(version),
  };
});

handleIpcMainInvoke('verify-update-package', async (event) => {
  if (!verifyState.downloadedFileAbsPath) {
    return {
      error: 'no downloaded file',
      isValid: false,
    };
  }
  if (!verifyState.expectedSha512) {
    return {
      error: `don't know sha512 of downloaded file`,
      isValid: false,
    };
  }

  const actualSha512 = await getFileSha512(verifyState.downloadedFileAbsPath);

  if (actualSha512 !== verifyState.expectedSha512) {
    logger.error(
      `[verify-update-package] failed, expect sha512 ${verifyState.expectedSha512} but got ${actualSha512}}`
    );

    Sentry.captureException({
      message: `Verify update package failed`,
      tags: {
        appVersion: app.getVersion(),
      },
      extra: {
        expectSha512: verifyState.expectedSha512,
        actualSha512,
      },
    });

    return {
      error: `sha512 of downloaded file is not matched`,
      isValid: false,
    };
  }

  return {
    error: null,
    isValid: true,
  };
});

onIpcMainInternalEvent('__internal_main:dev', async (payload) => {
  const autoUpdater = (await getAutoUpdater()) as AppUpdaterDarwin;
  switch (payload.type) {
    case 'child_process:_notifyUpdatingWindow': {
      autoUpdater._spawnNotifyInstall();
      break;
    }
    case 'child_process:_notifyKillUpdatingWindow': {
      autoUpdater._killAllNotifyInstall();
      break;
    }
    default:
      break;
  }
});

onceIpcMainInternalEvent(
  '__internal_main:mainwindow:will-show-on-bootstrap',
  async () => {
    if (process.platform !== 'darwin') return;

    const autoUpdater = (await getAutoUpdater()) as AppUpdaterDarwin;
    autoUpdater._killAllNotifyInstall();
  }
);
