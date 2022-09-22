/**
 * communication with main process, wrapp as hooks
 */

/// <reference path="../preload.d.ts" />

import { useEffect, useState } from 'react';
import { randString } from '../../isomorphic/string';

export function useAppVersion() {
  const reqid = randString();
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.on(
      'get-app-version',
      (event) => {
        if (event.reqid === reqid) {
          setVersion(event.version);
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('get-app-version', reqid);
  }, []);

  return version;
}
