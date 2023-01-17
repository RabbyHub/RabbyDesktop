import { atom, useAtom } from 'jotai';
import { useCallback, useState } from 'react';

const devicesAtom = atom<IHidDeviceInfo[]>([]);

export function useHidDevices() {
  const [devices, setDevices] = useAtom(devicesAtom);

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
