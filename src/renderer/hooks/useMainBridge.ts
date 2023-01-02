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
    window.rabbyDesktop.ipcRenderer
      .invoke('get-app-version', reqIdRef.current)
      .then((event) => {
        if (event.reqid === reqIdRef.current) {
          setVersion(event.version);
        }
      });
  }, []);

  return version;
}
