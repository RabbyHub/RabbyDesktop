import nodeHid = require('node-hid');
import usb = require('usb');

import { pickAllNonFnFields } from '@/isomorphic/json';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { isInternalProtocol } from '@/isomorphic/url';
import { handleIpcMainInvoke, sendToWebContents } from '../utils/ipcMainEvents';
import { getSessionInsts, getAllMainUIViews } from '../utils/stream-helpers';

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

  mainSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      if (permission === 'hid') {
        // Add logic here to determine if permission should be given to allow HID selection
        return true;
      }
      switch (permission) {
        case 'clipboard-sanitized-write':
        case 'accessibility-events':
          return true;
        case 'serial':
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
  let nodeDevices: nodeHid.Device[] = [];

  try {
    nodeDevices = nodeHid.devices();
  } catch (e) {
    console.error(e);
    return {
      error: 'Not supported on this platform',
      devices: [],
    };
  }

  if (opts?.filters) {
    const filters = Array.isArray(opts.filters) ? opts.filters : [opts.filters];
    filters.forEach((filter) => {
      if (filter.vendorId) {
        nodeDevices = nodeDevices.filter((d) => d.vendorId === filter.vendorId);
      }
      if (filter.productId) {
        nodeDevices = nodeDevices.filter(
          (d) => d.productId === filter.productId
        );
      }
      if (filter.usagePage) {
        nodeDevices = nodeDevices.filter(
          (d) => d.usagePage === filter.usagePage
        );
      }
      if (filter.usage) {
        nodeDevices = nodeDevices.filter((d) => d.usage === filter.usage);
      }
    });
  }

  return {
    devices: nodeDevices,
  };
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
