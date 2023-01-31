import { arraify } from '@/isomorphic/array';
import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { useHIDDevices, useUSBDevices } from '@/renderer/hooks/useDevices';
import { message } from 'antd';
import { useState } from 'react';

export type IPerspective = 'hid' | 'usb';
export function useFilteredDevices(type: IPerspective) {
  const hidInfo = useHIDDevices();
  const usbInfo = useUSBDevices();

  const [filterKeyword, setFilterKeyword] = useState('');
  const debouncedKeyword = useDebounceValue(filterKeyword, 300);

  return {
    ...(type === 'hid'
      ? {
          isFetchingDevice: hidInfo.isFetchingDevice,
          fetchDevices: hidInfo.fetchDevices,
        }
      : {
          isFetchingDevice: usbInfo.isFetchingDevice,
          fetchDevices: usbInfo.fetchDevices,
        }),

    hidDevices: hidInfo.devices,
    usbDevices: usbInfo.devices,

    type,

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
