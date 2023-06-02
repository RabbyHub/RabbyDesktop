import { arraify } from '@/isomorphic/array';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { useHIDDevices, useUSBDevicesOnDev } from '@/renderer/hooks/useDevices';
import { message } from 'antd';
import { useState } from 'react';

export type IPerspective = 'hid' | 'usb';
export function useFilteredHidDevices() {
  const hidInfo = useHIDDevices();
  const usbInfo = useUSBDevicesOnDev();

  const [filterKeyword, setFilterKeyword] = useState('');
  const debouncedKeyword = useDebounceValue(filterKeyword, 300);

  return {
    isFetchingDevice: hidInfo.isFetchingDevice,
    fetchDevices: hidInfo.fetchDevices,

    hidDevices: hidInfo.devices,
    usbDevices: usbInfo.devices,

    filterKeyword,
    setFilterKeyword,
    debouncedKeyword,
  };
}

export function useFilteredUsbDevicesOnDev() {
  const usbInfo = useUSBDevicesOnDev();

  const [filterKeyword, setFilterKeyword] = useState('');
  const debouncedKeyword = useDebounceValue(filterKeyword, 300);

  return {
    isFetchingDevice: usbInfo.isFetchingDevice,
    fetchDevices: usbInfo.fetchDevices,

    usbDevices: usbInfo.devices,

    filterKeyword,
    setFilterKeyword,
    debouncedKeyword,
  };
}

export function testRequestDevice(
  fitlerItem: HIDDeviceFilter | HIDDeviceFilter[] = []
) {
  const filters = arraify(fitlerItem).filter(Boolean);
  window.navigator.hid
    .requestDevice({
      filters,
    })
    .then((result) => {
      console.debug('[debug] testRequestDevice', result);
      message.open({
        type: result.length ? 'success' : 'warning',
        content: `Request device finished, ${result.length} selected`,
      });
    });
}
