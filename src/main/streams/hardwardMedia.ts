import path from 'path';
import child_process from 'child_process';
import { shell, systemPreferences } from 'electron';
import { Subject, firstValueFrom } from 'rxjs';

import { randString } from '@/isomorphic/string';
import { APP_BRANDNAME, IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { toggleSelectCamera } from '../utils/stream-helpers';
import { desktopAppStore } from '../store/desktopApp';
import { pushEventToAllUIsCareAboutCameras } from '../utils/tabbedBrowserWindow';
import { rabbyxExecuteJsOnBlank } from './rabbyIpcQuery/_base';
import { getAssetPath } from '../utils/app';
import { alertRestartApp } from '../utils/mainTabbedWin';

const IS_DARWIN = process.platform === 'darwin';
async function tryToEnsureCameraAccess(askIfNotGranted = true) {
  if (!IS_DARWIN) return 'granted' as const;

  const prevAccessStatus = systemPreferences.getMediaAccessStatus('camera');
  if (askIfNotGranted && prevAccessStatus !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  const finalAccessStatus = systemPreferences.getMediaAccessStatus('camera');

  if (
    prevAccessStatus === 'not-determined' &&
    finalAccessStatus === 'granted'
  ) {
    alertRestartApp({
      forceRestart: true,
      msgBoxOptions: {
        title: 'Camera Access Updated',
        message: `Camera access has been granted. It's required to restart ${APP_BRANDNAME}.`,
      },
    });
  }

  return finalAccessStatus;
}

async function getMediaDevices() {
  const mediaList: MediaDeviceInfo[] = await rabbyxExecuteJsOnBlank(`
  ;(async () => {
    const result = await window.navigator.mediaDevices.enumerateDevices().then((devices) => {
      return devices.filter((device) => device.kind === 'videoinput');
    });

    return result.map((device) => {
      return JSON.parse(JSON.stringify(device));
    });
  })();
  `);

  return mediaList;
}

handleIpcMainInvoke('get-media-access-status', async (_, type) => {
  return {
    accessStatus: IS_DARWIN
      ? systemPreferences.getMediaAccessStatus(type)
      : ('granted' as const),
  };
});

handleIpcMainInvoke('enumerate-camera-devices', async () => {
  return {
    mediaList: await getMediaDevices(),
  };
});

const selectCameraState = {
  selectId: null as string | null,
};
const confirmedSelectedCameraSubj = new Subject<{
  selectId: string;
  constrains: IDesktopAppState['selectedMediaConstrains'];
  isCanceled?: boolean;
  cameraAccessStatus: IDarwinMediaAccessStatus;
}>();
const confirmedSelectedCamera$ = confirmedSelectedCameraSubj.asObservable();
handleIpcMainInvoke('start-select-camera', async (_, opts) => {
  const selectId = randString();
  selectCameraState.selectId = selectId;

  const mediaDevices = await getMediaDevices();
  const selectedMediaConstrains = desktopAppStore.get(
    'selectedMediaConstrains'
  );

  const { forceUserSelect } = opts || {};
  let matchedConstrains: IDesktopAppState['selectedMediaConstrains'] = null;

  const result = {
    selectId,
    cameraAccessStatus: await tryToEnsureCameraAccess(),
  };

  if (!forceUserSelect) {
    if (mediaDevices.length === 1) {
      matchedConstrains = {
        label: mediaDevices[0].label,
      };

      desktopAppStore.set('selectedMediaConstrains', matchedConstrains);

      return {
        ...result,
        constrains: matchedConstrains,
      };
    }
    if (
      selectedMediaConstrains?.label &&
      mediaDevices.find(
        (device) =>
          selectedMediaConstrains?.label &&
          device.label === selectedMediaConstrains.label
      )
    ) {
      return {
        ...result,
        constrains: selectedMediaConstrains,
      };
    }
  }

  toggleSelectCamera(selectId, true);

  const waitResult = await firstValueFrom(confirmedSelectedCamera$);

  matchedConstrains = waitResult.constrains;

  return {
    ...result,
    constrains: matchedConstrains,
    isCanceled: !!waitResult.isCanceled,
  };
});

handleIpcMainInvoke('finish-select-camera', (_, payload) => {
  if (payload.selectId !== selectCameraState.selectId) {
    console.warn(
      `selectId not match, expect ${selectCameraState.selectId}, got ${payload.selectId}`
    );
  }

  selectCameraState.selectId = null;
  toggleSelectCamera(payload.selectId, false);

  if (!payload.isCanceled) {
    desktopAppStore.set('selectedMediaConstrains', payload.constrains);
    pushEventToAllUIsCareAboutCameras({
      eventType: 'push-selected-media-video',
      constrains: payload.constrains,
    });
  }

  confirmedSelectedCameraSubj.next({
    selectId: payload.selectId,
    constrains: payload.constrains,
    isCanceled: !!payload.isCanceled,
    cameraAccessStatus: systemPreferences.getMediaAccessStatus('camera'),
  });

  return {
    error: null,
  };
});

handleIpcMainInvoke('darwin:quick-open-privacy-camera', async () => {
  if (!IS_DARWIN) return;

  // NOTICE: only valid on macOS greater than 10.14
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera'
  );
});

handleIpcMainInvoke('rabbyx:get-selected-camera', (_) => {
  return {
    constrains: desktopAppStore.get('selectedMediaConstrains', null),
  };
});

/**
 * @deprecated if you don't know what you are doing, don't use this
 */
async function getCameraAccessStatusBySpawn() {
  const child = child_process.spawn(
    path.resolve(getAssetPath('scripts', 'get-camera-access-status.js'))
    // { env: { ELECTRON_RUN_AS_NODE: '1', } }
  );

  const result = await new Promise<IDarwinMediaAccessStatus>(
    (resolve, reject) => {
      child?.stdout?.on('data', (data) => {
        const output = (data?.toString('utf8') || '').trim();
        resolve(output);
      });

      if (!IS_RUNTIME_PRODUCTION) {
        child?.stderr?.on('data', (data) => {
          console.debug(data);
        });
      }

      child.on('error', (err) => {
        if (!IS_RUNTIME_PRODUCTION) {
          console.error(err);
        }
        resolve('denied' as const);
      });
    }
  );

  child?.kill();

  return result;
}
