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
  const prevCameraAccessStatus =
    systemPreferences.getMediaAccessStatus('camera');
  if (!IS_DARWIN)
    return {
      prevCameraAccessStatus,
      finalCameraAccessStatus: prevCameraAccessStatus,
    };

  if (askIfNotGranted && prevCameraAccessStatus !== 'granted') {
    await systemPreferences.askForMediaAccess('camera');
  }

  const finalAccessStatus = systemPreferences.getMediaAccessStatus('camera');

  if (
    prevCameraAccessStatus === 'not-determined' &&
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

  return {
    prevCameraAccessStatus,
    finalCameraAccessStatus: finalAccessStatus,
  };
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

async function waitSecond(second = 1) {
  return new Promise((resolve) => {
    setTimeout(resolve, second * 1000);
  });
}

handleIpcMainInvoke('get-media-access-status', async (_, type) => {
  return {
    accessStatus: systemPreferences.getMediaAccessStatus(type),
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

  const { prevCameraAccessStatus, finalCameraAccessStatus } =
    await tryToEnsureCameraAccess();
  const result = {
    selectId: selectId as string | null,
    prevCameraAccessStatus,
    cameraAccessStatus: finalCameraAccessStatus,
  };

  /**
   * @notice generally, after invoke this method 'start-select-camera', the client
   * will call `window.navigator.mediaDevices.getUserMedia` to get the camera stream,
   * such as `BrowserQRCodeReader::decodeFromVideoDevice` from @zxing/browser.
   *
   * We found, if we return the result too fast, the client will not get the camera stream
   * correctly sometimes. So we wait 1 second before return the result.
   */
  async function beforeEarlyReturnOnNoNeedToSelect() {
    // eslint-disable-next-line no-multi-assign
    result.selectId = selectCameraState.selectId = null;
    await waitSecond(1);
  }

  /**
   * @description we can ONLY try to passby user-select if the camera access status is 'granted'
   */
  const canPassby = finalCameraAccessStatus === 'granted';
  if (!forceUserSelect && canPassby) {
    if (mediaDevices.length === 1) {
      matchedConstrains = {
        label: mediaDevices[0].label,
      };

      desktopAppStore.set('selectedMediaConstrains', matchedConstrains);
      await beforeEarlyReturnOnNoNeedToSelect();

      return {
        ...result,
        constrains: matchedConstrains,
      };
    }
    // if (
    //   selectedMediaConstrains?.label &&
    //   mediaDevices.find(
    //     (device) =>
    //       selectedMediaConstrains?.label &&
    //       device.label === selectedMediaConstrains.label
    //   )
    // ) {
    //   await beforeEarlyReturnOnNoNeedToSelect();

    //   return {
    //     ...result,
    //     constrains: selectedMediaConstrains,
    //   };
    // }
  }

  toggleSelectCamera(selectId, true);

  const waitResult = await firstValueFrom(confirmedSelectedCamera$);
  matchedConstrains = waitResult.constrains;
  result.cameraAccessStatus = waitResult.cameraAccessStatus;

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

handleIpcMainInvoke('redirect-to-setting-privacy-camera', async () => {
  if (IS_DARWIN) {
    // NOTICE: only valid on macOS greater than 10.14
    shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera'
    );
  } else {
    shell.openExternal('ms-settings:privacy-webcam');
    // deprecated setting on lower version Windows
    // shell.openExternal('ms-settings:camera');
  }
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
