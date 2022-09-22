import { app } from "electron";
import AppUpdater from "../updater/updater";
import { onIpcMainEvent } from "../utils/ipcMainEvents";
import { cLog } from "../utils/log";

let autoUpdater: AppUpdater;

const state = {
  downloadP: null as null | Promise<any>
}

async function getAutoUpdater() {
  // TODO: use better custom event 'app-setup'
  await app.whenReady();

  if (!autoUpdater) {
    autoUpdater = new AppUpdater();

    // autoUpdater.on('checking-for-update', () => {
    //   cLog('autoUpdater:: checking-for-update', 'checking-for-update');
    // });
    // autoUpdater.on('update-available', (info) => {
    //   cLog('autoUpdater:: update-available', info);
    // });
    // autoUpdater.on('update-not-available', (info) => {
    //   cLog('autoUpdater:: update-not-available', info);
    // });
    // autoUpdater.on('update-cancelled', (info) => {
    //   cLog('autoUpdater:: update-cancelled', info);
    // });
  }

  return autoUpdater;
}

onIpcMainEvent('check-if-new-release', async (event, reqid) => {
  const autoUpdater = await getAutoUpdater();

  autoUpdater.once('update-available', (info) => {
    event.reply('check-if-new-release', {
      reqid,
      ...info ? {
        hasNewRelease: true,
        releaseVersion: info.version
      } : {
        hasNewRelease: false,
        releaseVersion: null
      }
    });
  });
  autoUpdater.once('update-not-available', (info) => {
    event.reply('check-if-new-release', {
      reqid,
      hasNewRelease: false,
      releaseVersion: null
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
    cLog('autoUpdater:: download-progress', info);

    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: info,
        isEnd: false,
      }
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    cLog('autoUpdater:: update-downloaded', info);

    event.reply('download-release-progress-updated', {
      originReqId: reqid,
      download: {
        progress: null,
        isEnd: true
      }
    });
  });

  if (!state.downloadP) {
    state.downloadP = autoUpdater.downloadUpdate();
  }

  await state.downloadP;
  state.downloadP = null;
})
