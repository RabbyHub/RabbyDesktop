/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { useCallback, useEffect, useState } from 'react';
import { randString } from '../../isomorphic/string';

import { useAppVersion } from './useMainBridge';

async function checkIfNewRelease() {
  const reqid = randString();

  return new Promise<IAppUpdatorCheckResult>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'check-if-new-release',
      (event) => {
        const { reqid: _reqid, ...rest } = event
        if (_reqid === reqid) {
          resolve(rest);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('check-if-new-release', reqid);
  });
}

type OnDownloadFunc = (payload: IAppUpdatorDownloadProgress) => void;
async function startDownload({
  onDownload,
} : {
  onDownload?: OnDownloadFunc
} = {}) {
  const reqid = randString();

  return new Promise<void>((resolve, reject) => {
    const disposePending = window.rabbyDesktop.ipcRenderer.on('download-release-progress-updated', (event) => {
      onDownload?.(event.download)
      if (event.download.isEnd) {
        disposePending?.();
      }
    });

    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'start-download',
      (event) => {
        if (event.reqid === reqid) {
          resolve();

          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('start-download', reqid);
  });
}

export function useAppUpdator() {
  const [releaseCheckInfo, setReleaseCheckInfo] = useState<IAppUpdatorCheckResult>({
    hasNewRelease: false,
    releaseVersion: null,
  });

  const [downloadInfo, setDownloadInfo] = useState<null | IAppUpdatorDownloadProgress>(null);
  const onDownload: OnDownloadFunc = useCallback((info) => {
    setDownloadInfo(info);
  }, []);

  const requestDownload = useCallback(async () => {
    await startDownload({ onDownload });
  }, [ onDownload ]);

  useEffect(() => {
    const fetchReleaseInfo = () => {
      // eslint-disable-next-line promise/catch-or-return
      checkIfNewRelease().then((newVal) => {
        setReleaseCheckInfo(newVal);
        return newVal;
      });
    }
    fetchReleaseInfo();
    const timer = setInterval(() => {
      fetchReleaseInfo();
    }, 1000 * 60 * 60 * 0.5);

    return () => {
      clearInterval(timer);
    }
  }, []);

  console.log('[feat] releaseCheckInfo', releaseCheckInfo);

  return {
    releaseCheckInfo,
    isDownloading: !!downloadInfo && !downloadInfo.isEnd,
    isDownloaded: releaseCheckInfo.hasNewRelease && !!downloadInfo && downloadInfo.isEnd,
    requestDownload,
    downloadInfo,
  };
}
