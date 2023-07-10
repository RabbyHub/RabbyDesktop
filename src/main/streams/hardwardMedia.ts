import { randString } from '@/isomorphic/string';
import { Subject, firstValueFrom } from 'rxjs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { toggleSelectCamera } from '../utils/stream-helpers';
import { desktopAppStore } from '../store/desktopApp';
import { pushEventToAllUIsCareAboutCameras } from '../utils/tabbedBrowserWindow';
import { rabbyxExecuteJsOnBlank } from './rabbyIpcQuery/_base';

handleIpcMainInvoke('enumerate-camera-devices', async () => {
  let mediaList: MediaDeviceInfo[] = [];

  mediaList = await rabbyxExecuteJsOnBlank(`
  ;(async () => {
    const result = await window.navigator.mediaDevices.enumerateDevices().then((devices) => {
      return devices.filter((device) => device.kind === 'videoinput');
    });

    return result.map((device) => {
      return JSON.parse(JSON.stringify(device));
    });
  })();
  `);

  return {
    mediaList,
  };
});

const selectCameraState = {
  selectId: null as string | null,
};
const confirmedSelectedCameraSubj = new Subject<{
  selectId: string;
  deviceId: MediaStream['id'] | null;
}>();
const confirmedSelectedCamera$ = confirmedSelectedCameraSubj.asObservable();
handleIpcMainInvoke('start-select-camera', async (_, opts) => {
  const selectId = randString();
  selectCameraState.selectId = selectId;

  toggleSelectCamera(selectId, true);

  const { ignoreSelectResult } = opts || {};

  let deviceId: MediaDeviceInfo['deviceId'] | null = null;

  if (!ignoreSelectResult) {
    const waitResult = await firstValueFrom(confirmedSelectedCamera$);
    deviceId = waitResult.deviceId;
  }

  return {
    selectId,
    deviceId,
  };
});

handleIpcMainInvoke('confirm-selected-camera', (_, payload) => {
  if (payload.selectId !== selectCameraState.selectId) {
    console.warn(
      `selectId not match, expect ${selectCameraState.selectId}, got ${payload.selectId}`
    );
  }

  selectCameraState.selectId = null;
  toggleSelectCamera(payload.selectId, false);

  desktopAppStore.set('selectedMediaVideoId', payload.deviceId);
  confirmedSelectedCameraSubj.next({
    selectId: payload.selectId,
    deviceId: payload.deviceId,
  });
  pushEventToAllUIsCareAboutCameras({
    eventType: 'push-selected-media-video',
    selectedMediaVideoId: payload.deviceId,
  });

  return {
    error: null,
  };
});

handleIpcMainInvoke('rabbyx:get-selected-camera', (_) => {
  return {
    deviceId: desktopAppStore.get('selectedMediaVideoId', null),
  };
});
