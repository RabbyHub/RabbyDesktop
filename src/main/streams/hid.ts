import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { isInternalProtocol } from '@/isomorphic/url';
import { randString } from '@/isomorphic/string';
import { catchError, filter as filterOp, of, Subject, timeout } from 'rxjs';
import { arraify } from '@/isomorphic/array';
import { handleIpcMainInvoke, sendToWebContents } from '../utils/ipcMainEvents';
import {
  getSessionInsts,
  getAllMainUIViews,
  stopSelectDevices,
  startSelectDevices,
} from '../utils/stream-helpers';
import { filterNodeHIDDevices } from '../utils/devices';

async function pushHidSelectDevices(deviceList: IHidDevice[]) {
  const { views } = await getAllMainUIViews();
  const targeWins = [views['select-devices']];

  targeWins.forEach((window) => {
    sendToWebContents(
      window.webContents,
      '__internal_push:webhid:select-list',
      {
        // deviceList: mergeNodeHIDInfo(deviceList),
        deviceList,
      }
    );
  });
}

const SelectSubject = new Subject<ISelectDeviceState>();
const selecteDevice$ = SelectSubject.asObservable();

handleIpcMainInvoke('confirm-selected-device', (_, payload) => {
  SelectSubject.next({
    selectId: payload.selectId,
    ...(!payload.device
      ? {
          status: 'rejected',
        }
      : {
          status: 'selected',
          deviceInfo: {
            productId: payload.device.productId,
            vendorId: payload.device.vendorId,
            deviceId: payload.device.deviceId,
          },
        }),
  });

  return {
    error: '',
  };
});

const SELECT_DEVICE_TIMEOUT = 180 * 1e3;
getSessionInsts().then(({ mainSession }) => {
  mainSession.on(
    'select-hid-device',
    (eventSelectHidDevice, details, callback) => {
      eventSelectHidDevice.preventDefault();
      // leave here for debug
      // console.debug('[debug] select-hid-device:: details', details);

      if (details.deviceList.length === 1) {
        callback(details.deviceList[0].deviceId);
        return;
      }

      const selectId = randString();
      SelectSubject.next({ selectId, status: 'pending' });

      pushHidSelectDevices(details.deviceList);
      const sub = selecteDevice$
        .pipe(
          filterOp(
            ({ selectId: sid, status }) =>
              sid === selectId && status !== 'pending'
          ),
          // TODO: should we support timeout mechanism here?
          timeout(SELECT_DEVICE_TIMEOUT),
          catchError(() => {
            return of({ selectId, status: 'rejected' as const });
          })
        )
        .subscribe((selectResult) => {
          // leave here for debug
          // console.debug('[debug] select-hid-device:: selectResult', selectResult);
          sub.unsubscribe();
          stopSelectDevices();

          switch (selectResult.status) {
            default:
              throw new Error(`unexpected status ${selectResult.status}`);
            case 'rejected':
              callback(null);
              break;
            case 'selected': {
              const selectedId = selectResult.deviceInfo.deviceId;

              if (!details.deviceList.find((d) => d.deviceId === selectedId)) {
                console.error(
                  `[error] select-hid-device:: device ${selectedId} not found`
                );
                callback(null);
              } else {
                callback(selectResult.deviceInfo.deviceId);
              }

              break;
            }
          }
        });

      startSelectDevices(selectId);

      mainSession.on('hid-device-added', (_, eventDetails) => {
        console.debug('hid-device-added FIRED WITH', eventDetails.device);
        // Optionally update details.deviceList
        const eids = new Set(details.deviceList.map((d) => d.deviceId));
        let updated = false;
        const devices = arraify(eventDetails?.device).filter(Boolean);
        devices.forEach((d) => {
          if (!eids.has(d.deviceId)) {
            details.deviceList.push(d);
            updated = true;
          }
        });

        if (updated) {
          pushHidSelectDevices(details.deviceList);
        }
      });

      mainSession.on('hid-device-removed', (_, eventDetails) => {
        console.debug('hid-device-removed FIRED WITH', eventDetails.device);
        const devices = arraify(eventDetails?.device).filter(Boolean);
        const rids = new Set(devices.map((d) => d.deviceId));
        // Optionally update details.deviceList
        details.deviceList = details.deviceList.filter(
          (d) => !rids.has(d.deviceId)
        );

        pushHidSelectDevices(details.deviceList);
      });
    }
  );

  mainSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      // leave here for debug
      // console.debug('[debug] setPermissionCheckHandler:: permission', permission);
      switch (permission) {
        case 'clipboard-sanitized-write':
        case 'accessibility-events':
        case 'background-sync':
          return true;
        case 'serial':
        case 'hid':
        default: {
          if (isInternalProtocol(requestingOrigin)) {
            return true;
          }
          break;
        }
      }

      if (!IS_RUNTIME_PRODUCTION) {
        console.log(
          `Permission Denied: called for ${permission} from ${requestingOrigin} with details:`,
          details
        );
      }

      return false;
    }
  );
});

handleIpcMainInvoke('get-hid-devices', async (_, opts) => {
  return filterNodeHIDDevices(opts);
});
