import useDebounceValue from '@/renderer/hooks/useDebounceValue';
import { useHIDDevices, useUSBDevices } from '@/renderer/hooks/useDevices';
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
