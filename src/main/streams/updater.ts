import { app } from 'electron';
import { getAppProxyConfigForAxios } from '../store/desktopApp';
import { AppUpdaterWin32, AppUpdaterDarwin } from '../updater/updater';
import { IS_APP_PROD_BUILD } from '../utils/app';
import { setSessionProxy } from '../utils/appNetwork';
import { fetchText } from '../utils/fetch';
import { handleIpcMainInvoke, onIpcMainEvent } from '../utils/ipcMainEvents';
import { getBindLog } from '../utils/log';
import { getAppRuntimeProxyConf } from '../utils/stream-helpers';

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
    proxy: getAppProxyConfigForAxios(),
  }).catch(() => ''); // TODO: report error
}

let gAutoUpdater: AppUpdaterWin32 | AppUpdaterDarwin;

const state = {
  downloadP: null as null | Promise<any>,
};

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

onIpcMainEvent('start-download', async (event, reqid) => {
  const autoUpdater = await getAutoUpdater();
  await autoUpdater.checkForUpdates();

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

    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: null,
        isEnd: true,
      },
    });
  });

  if (!state.downloadP) {
    state.downloadP = autoUpdater.downloadUpdate();
  }

  await state.downloadP;
  state.downloadP = null;
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
