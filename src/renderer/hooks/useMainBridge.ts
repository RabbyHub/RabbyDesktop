/**
 * communication with main process, wrapp as hooks
 */

/// <reference path="../preload.d.ts" />

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
