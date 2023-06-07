import isDeepEqual from 'fast-deep-equal';
import * as Sentry from '@sentry/electron/main';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { pickAllNonFnFields } from '@/isomorphic/json';
import {
  Observable,
  distinctUntilChanged,
  filter as rxFilter,
  interval,
  map,
  merge,
  throttleTime,
} from 'rxjs';
import { handleIpcMainInvoke } from '../utils/ipcMainEvents';
import { filterNodeHIDDevices } from '../utils/devices';
import { pushEventToAllUIsCareAboutHidDevices } from '../utils/tabbedBrowserWindow';

let webusb$: Observable<void> | null = null;

try {
  // eslint-disable-next-line global-require
  const usb = require('usb') as typeof import('usb');
  const webusb = new usb.WebUSB({
    allowAllDevices: true,
  });

  webusb$ = new Observable<void>((subscriber) => {
    webusb.addEventListener('connect', async (event) => {
      if (!IS_RUNTIME_PRODUCTION) console.info('[usb::event] connect', event);
      subscriber.next();

      // pushEventToAllUIsCareAboutHidDevices({
      //   eventType: 'change-detected',
      //   changes: {
      //     type: 'connect',
      //     device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      //   },
      // });
    });
    webusb.addEventListener('disconnect', async (event) => {
      if (!IS_RUNTIME_PRODUCTION)
        console.info('[usb::event] disconnect', event);
      subscriber.next();

      // pushEventToAllUIsCareAboutHidDevices({
      //   eventType: 'change-detected',
      //   changes: {
      //     type: 'disconnect',
      //     device: pickAllNonFnFields(event.device) as INodeWebUSBDevice,
      //   },
      // });
    });
  });

  // notice: this method only used for debug, don't depend on it on production
  handleIpcMainInvoke('dev-only:get-usb-devices', async (_, opts) => {
    const usbDevicesOrig = await webusb.getDevices();

    let usbDevices = [] as typeof usbDevicesOrig;
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
      const filters = Array.isArray(opts.filters)
        ? opts.filters
        : [opts.filters];
      filters.forEach((filter) => {
        if (filter.vendorId) {
          usbDevices = usbDevices.filter((d) => d.vendorId === filter.vendorId);
        }
        if (filter.productId) {
          usbDevices = usbDevices.filter(
            (d) => d.productId === filter.productId
          );
        }
      });
    }

    return {
      devices: usbDevices.map((d) => pickAllNonFnFields(d)),
    };
  });
} catch (err: any) {
  console.error('[usb] init usb module error', err);
  // Sentry.captureException(err);
  Sentry.captureEvent({
    message: '[usb] init usb module error',
    level: 'error',
    tags: {
      error: err?.toString(),
    },
  });
}

(webusb$ ? merge(interval(750), webusb$) : interval(750))
  .pipe(
    throttleTime(250),
    map(() => filterNodeHIDDevices()),
    rxFilter((listResult) => !listResult.error),
    map((lR) => lR.devices),
    distinctUntilChanged((prev, current) => {
      return isDeepEqual(prev, current);
    })
  )
  .subscribe(async (latestDevices) => {
    pushEventToAllUIsCareAboutHidDevices({
      eventType: 'push-hiddevice-list',
      deviceList: latestDevices,
    });
  });
