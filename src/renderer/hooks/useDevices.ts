import { atom, useAtom } from 'jotai';
import { useCallback, useState } from 'react';

const hidDevicesAtom = atom<IHidDeviceInfo[]>([]);
export function useHIDDevices() {
  const [devices, setDevices] = useAtom(hidDevicesAtom);

  const [isFetching, setIsFetching] = useState(false);

  const fetchDevices = useCallback(() => {
    if (isFetching) return;

    setIsFetching(true);
    window.rabbyDesktop.ipcRenderer
      .invoke('get-hid-devices')
      .then((res) => {
        setDevices(res.devices);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  return {
    isFetchingDevice: isFetching,
    devices,
    fetchDevices,
  };
}

const usbDevicesAtom = atom<IUSBDevice[]>([]);
export function useUSBDevices() {
  const [devices, setDevices] = useAtom(usbDevicesAtom);

  const [isFetching, setIsFetching] = useState(false);

  const fetchDevices = useCallback(() => {
    if (isFetching) return;

    setIsFetching(true);
    window.rabbyDesktop.ipcRenderer
      .invoke('get-usb-devices')
      .then((res) => {
        setDevices(res.devices);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, []);

  return {
    isFetchingDevice: isFetching,
    devices,
    fetchDevices,
  };
}
