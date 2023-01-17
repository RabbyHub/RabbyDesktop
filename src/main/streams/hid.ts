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
      console.debug('[feat] callback', callback);
      if (details.deviceList && details.deviceList.length > 0) {
        callback(details.deviceList[0].deviceId);
      }
    }
  );

  mainSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log(permission);
      if (permission === 'hid') {
        // Add logic here to determine if permission should be given to allow HID selection
        return true;
      }
      if (permission === 'serial') {
        // Add logic here to determine if permission should be given to allow serial port selection
      }
      return false;
    }
  );
});
