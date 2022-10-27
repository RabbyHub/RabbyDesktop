/**
 * communication with main process, wrapp as hooks
 */

/// <reference path="../preload.d.ts" />

import { useEffect, useRef, useState } from 'react';
import { randString } from '../../isomorphic/string';

export function useAppVersion() {
  const reqIdRef = useRef(randString());
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on('get-app-version', (event) => {
      if (event.reqid === reqIdRef.current) {
        setVersion(event.version);
      }
    });
    window.rabbyDesktop.ipcRenderer.sendMessage(
      'get-app-version',
      reqIdRef.current
    );
  }, []);

  return version;
}
