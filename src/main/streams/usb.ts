import usb = require('usb');

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { pickAllNonFnFields } from '@/isomorphic/json';
import { handleIpcMainInvoke, sendToWebContents } from '../utils/ipcMainEvents';
import {
  getAllMainUIViews,
  getAllRabbyXWindowWebContentsList,
} from '../utils/stream-helpers';

const webusb = new usb.WebUSB({
  allowAllDevices: true,
});

webusb.addEventListener('connect', async (event) => {
  // if (!IS_RUNTIME_PRODUCTION)
  console.info('[usb::event] connect', event);

  const { list } = await getAllMainUIViews();
  const rabbyxSignWebContentsList = getAllRabbyXWindowWebContentsList();

  [...list, ...rabbyxSignWebContentsList].forEach((view) => {
    sendToWebContents(view, '__internal_push:webusb:device-changed', {
      changes: {
        type: 'connect',
        device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      },
    });
  });
});

webusb.addEventListener('disconnect', async (event) => {
  // if (!IS_RUNTIME_PRODUCTION)
  console.info('[usb::event] disconnect', event);

  const { list } = await getAllMainUIViews();
  const rabbyxSignWebContentsList = getAllRabbyXWindowWebContentsList();

  console.log('[feat] rabbyxSignWebContentsList', rabbyxSignWebContentsList);
  [...list, ...rabbyxSignWebContentsList].forEach((view) => {
    sendToWebContents(view, '__internal_push:webusb:device-changed', {
      changes: {
        type: 'disconnect',
        device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      },
    });
  });
});

// trigger once to activate the event listener
webusb.getDevices();

handleIpcMainInvoke('get-usb-devices', async (_, opts) => {
  const usbDevicesOrig = await webusb.getDevices();

  const usbDevices = [] as typeof usbDevicesOrig;
  // dedupe
  usbDevicesOrig.forEach((d) => {
    if (
      !usbDevices.find(
        (d2) => d2.productId === d.productId && d2.vendorId === d.vendorId
      )
    ) {
      usbDevices.push(d);
    }
  });

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
