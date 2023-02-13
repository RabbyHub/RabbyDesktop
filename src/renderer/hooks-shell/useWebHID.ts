import { useCallback, useEffect, useState } from 'react';

let firstFetched = false;
export function useRequestDevice(opts?: HIDDeviceRequestOptions) {
  const [devices, setDevices] = useState<HIDDevice[]>([]);

  const fetchDevices = useCallback(() => {
    const filters = opts?.filters || [];
    firstFetched = true;
    window.navigator.hid
      .requestDevice({
        filters,
      })
      .then((res) => {
        setDevices(res);
      });
  }, [opts?.filters]);

  useEffect(() => {
    if (firstFetched) return;
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    fetchDevices,
  };
}
