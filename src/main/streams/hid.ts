import usb = require('usb');

import { pickAllNonFnFields } from '@/isomorphic/json';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { isInternalProtocol } from '@/isomorphic/url';
import { randString } from '@/isomorphic/string';
import { catchError, filter as filterOp, of, Subject, timeout } from 'rxjs';
import {
  emitIpcMainEvent,
  handleIpcMainInvoke,
  sendToWebContents,
} from '../utils/ipcMainEvents';
import { getSessionInsts, getAllMainUIViews } from '../utils/stream-helpers';
import { filterNodeHIDDevices } from '../utils/devices';

const webusb = new usb.WebUSB({
  allowAllDevices: true,
});

webusb.addEventListener('connect', async (event) => {
  if (!IS_RUNTIME_PRODUCTION) console.debug('[debug] connect', event);

  const { list } = await getAllMainUIViews();

  list.forEach((view) => {
    sendToWebContents(view, '__internal_push:webusb:device-changed', {
      changes: {
        type: 'connect',
        device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      },
    });
  });
});

webusb.addEventListener('disconnect', async (event) => {
  if (!IS_RUNTIME_PRODUCTION) console.debug('[debug] disconnect', event);

  const { list } = await getAllMainUIViews();

  list.forEach((view) => {
    sendToWebContents(view, '__internal_push:webusb:device-changed', {
      changes: {
        type: 'disconnect',
        device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      },
    });
  });
});

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

function startSelect(selectId: string) {
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    nextShow: true,
    type: 'select-devices',
    pageInfo: {
      type: 'select-devices',
      state: {
        selectId,
        status: 'pending',
      },
    },
  });
}

function stopSelect() {
  emitIpcMainEvent('__internal_main:popupview-on-mainwin:toggle-show', {
    nextShow: false,
    type: 'select-devices',
  });
}

const SELECT_DEVICE_TIMEOUT = 180 * 1e3;
getSessionInsts().then(({ mainSession }) => {
  mainSession.on(
    'select-hid-device',
    (eventSelectHidDevice, details, callback) => {
      eventSelectHidDevice.preventDefault();
      // leave here for debug
      // console.debug('[debug] select-hid-device:: details', details);

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
          stopSelect();

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

      startSelect(selectId);

      mainSession.on('hid-device-added', (_, eventDetails) => {
        console.debug('hid-device-added FIRED WITH', eventDetails);
        // Optionally update details.deviceList
        const eids = new Set(details.deviceList.map((d) => d.deviceId));
        let updated = false;
        const devices = Array.isArray(eventDetails?.device)
          ? eventDetails.device
          : [];
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
        console.debug('hid-device-removed FIRED WITH', eventDetails);
        const devices = Array.isArray(eventDetails?.device)
          ? eventDetails.device
          : [];
        const rids = new Set(devices.map((d) => d.deviceId));
        // Optionally update details.deviceList
        details.deviceList = details.deviceList.filter((d) =>
          rids.has(d.deviceId)
        );

        pushHidSelectDevices(details.deviceList);
      });
    }
  );

  mainSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      switch (permission) {
        case 'clipboard-sanitized-write':
        case 'accessibility-events':
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

handleIpcMainInvoke('get-usb-devices', async (_, opts) => {
  let usbDevices = await webusb.getDevices();

  if (opts?.filters) {
    const filters = Array.isArray(opts.filters) ? opts.filters : [opts.filters];
    filters.forEach((filter) => {
      if (filter.vendorId) {
        usbDevices = usbDevices.filter((d) => d.vendorId === filter.vendorId);
      }
      if (filter.productId) {
        usbDevices = usbDevices.filter((d) => d.productId === filter.productId);
      }
    });
  }

  return {
    devices: usbDevices.map((d) => pickAllNonFnFields(d)),
  };
});
