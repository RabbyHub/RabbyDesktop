import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { message } from 'antd';
import { atom, useAtom } from 'jotai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

const hidDevicesAtom = atom<INodeHidDeviceInfo[]>([]);
export function useHIDDevices() {
  const [devices, setDevices] = useAtom(hidDevicesAtom);
  const isFetchingRef = useRef(false);

  const fetchDevices = useCallback(() => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    window.rabbyDesktop.ipcRenderer
      .invoke('get-hid-devices')
      .then((res) => {
        if (res.error) {
          message.error(res.error);
          return;
        }
        setDevices(res.devices);
      })
      .finally(() => {
        isFetchingRef.current = false;
      });
  }, [setDevices]);

  useEffect(() => {
    fetchDevices();

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:webusb:events',
      (event) => {
        switch (event.eventType) {
          default:
            break;
          case 'change-detected': {
            fetchDevices();
            break;
          }
          case 'push-hiddevice-list': {
            setDevices(event.deviceList);
            break;
          }
        }
      }
    );
  }, [fetchDevices, setDevices]);

  return {
    isFetchingDevice: isFetchingRef.current,
    devices,
    fetchDevices,
  };
}

const usbDevicesAtom = atom<IUSBDevice[]>([]);
export function useUSBDevicesOnDev() {
  const [devices, setDevices] = useAtom(usbDevicesAtom);

  const [isFetching, setIsFetching] = useState(false);

  const fetchDevices = useCallback(() => {
    if (isFetching) return;

    setIsFetching(true);
    window.rabbyDesktop.ipcRenderer
      .invoke('dev-only:get-usb-devices')
      .then((res) => {
        setDevices(res.devices);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [isFetching, setDevices, setIsFetching]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:webusb:events',
      (event) => {
        if (event.eventType === 'change-detected') {
          fetchDevices();
        }
      }
    );
  }, [fetchDevices]);

  return {
    isFetchingDevice: isFetching,
    devices,
    fetchDevices,
  };
}

const doRequest = (evt?: MouseEvent) => {
  evt?.stopPropagation();

  window.navigator.hid
    .requestDevice({ filters: [] })
    .then((res) => {
      console.debug('[debug] selected device', res);
    })
    .catch((error) => {
      console.debug('[debug] error', error);
    });
};
/**
 * @description only used to test on dev mode
 */
export function useTestHidSelectModal() {
  useLayoutEffect(() => {
    if (IS_RUNTIME_PRODUCTION) return;

    document?.addEventListener('click', doRequest);

    return () => {
      document?.removeEventListener('click', doRequest);
    };
  }, []);

  return doRequest;
}
