import nodeHid from 'node-hid';

import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { getSessionInsts } from '../utils/stream-helpers';

getSessionInsts().then(({ mainSession }) => {
  mainSession.on(
    'select-hid-device',
    (eventSelectHidDevice, details, callback) => {
      console.debug('[debug] select-hid-device:: details', details);
      // console.debug('[debug] select-hid-device:: event', event);

      // Add events to handle devices being added or removed before the callback on
      // `select-hid-device` is called.
      mainSession.on('hid-device-added', (event, device) => {
        console.debug('hid-device-added FIRED WITH', device);
        // Optionally update details.deviceList
      });

      mainSession.on('hid-device-removed', (event, device) => {
        console.debug('hid-device-removed FIRED WITH', device);
        // Optionally update details.deviceList
      });

      eventSelectHidDevice.preventDefault();
      if (details.deviceList && details.deviceList.length > 0) {
        callback(details.deviceList[0].deviceId);
      }
    }
  );
});

handleIpcMainInvoke('get-hid-devices', async (_, opts) => {
  let devices = nodeHid.devices();

  if (opts?.filters) {
    const filters = Array.isArray(opts.filters) ? opts.filters : [opts.filters];
    filters.forEach((filter) => {
      if (filter.vendorId) {
        devices = devices.filter((d) => d.vendorId === filter.vendorId);
      }
      if (filter.productId) {
        devices = devices.filter((d) => d.productId === filter.productId);
      }
      if (filter.usagePage) {
        devices = devices.filter((d) => d.usagePage === filter.usagePage);
      }
      if (filter.usage) {
        devices = devices.filter((d) => d.usage === filter.usage);
      }
    });
  }

  return {
    devices,
  };
});
