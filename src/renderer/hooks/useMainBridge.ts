/**
 * communication with main process, wrapp as hooks
 */

/// <reference path="../preload.d.ts" />

import { useEffect, useState } from 'react';

export function useAppVersion() {
  const [version, setVersion] = useState<string>('-');

  useEffect(() => {
    const dispose = window.rabbyDesktop.ipcRenderer.once(
      'get-app-version',
      ({ version: v }) => {
        setVersion(v);
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('get-app-version');

    return dispose;
  }, []);

  return version;
}
