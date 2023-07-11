import { randString } from '@/isomorphic/string';
import { Subject, firstValueFrom } from 'rxjs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { toggleSelectCamera } from '../utils/stream-helpers';
import { desktopAppStore } from '../store/desktopApp';
import { pushEventToAllUIsCareAboutCameras } from '../utils/tabbedBrowserWindow';
import { rabbyxExecuteJsOnBlank } from './rabbyIpcQuery/_base';

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

  if (!forceUserSelect) {
    if (mediaDevices.length === 1) {
      matchedConstrains = {
        label: mediaDevices[0].label,
      };

      desktopAppStore.set('selectedMediaConstrains', matchedConstrains);

      return {
        selectId,
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
        selectId,
        constrains: selectedMediaConstrains,
      };
    }
  }

  toggleSelectCamera(selectId, true);

  const waitResult = await firstValueFrom(confirmedSelectedCamera$);

  matchedConstrains = waitResult.constrains;

  return {
    selectId,
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
  });

  return {
    error: null,
  };
});

handleIpcMainInvoke('rabbyx:get-selected-camera', (_) => {
  return {
    constrains: desktopAppStore.get('selectedMediaConstrains', null),
  };
});
