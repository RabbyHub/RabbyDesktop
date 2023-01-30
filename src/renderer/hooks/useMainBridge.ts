/**
 * communication with main process, wrapp as hooks
 */

/// <reference path="../preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useEffect, useState } from 'react';

export function useAppVersion() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.invoke('get-app-version').then((event) => {
      setVersion(event.version);
    });
  }, []);

  return version;
}

const osInfoAtom = atom<IOSInfo | null>(null);
export function useOSInfo() {
  const [osInfo, setOSInfo] = useAtom(osInfoAtom);

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.invoke('get-os-info').then((event) => {
      setOSInfo(event);
    });
  }, []);

  return osInfo;
}
