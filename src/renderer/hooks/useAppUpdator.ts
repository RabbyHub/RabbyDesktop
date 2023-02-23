/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { randString } from '../../isomorphic/string';

async function checkIfNewRelease() {
  const reqid = randString();

  return new Promise<IAppUpdatorCheckResult>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'check-if-new-release',
      (event) => {
        const { reqid: reqId, ...rest } = event;
        if (reqId === reqid) {
          resolve(rest);
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('check-if-new-release', reqid);
  });
}

async function quitAndUpgrade() {
  const reqid = randString();

  return new Promise<void>((resolve, reject) => {
    const dispose = window.rabbyDesktop.ipcRenderer.on(
      'quit-and-upgrade',
      (event) => {
        const { reqid: reqId } = event;
        if (reqId === reqid) {
          resolve();
          dispose?.();
        }
      }
    );
    window.rabbyDesktop.ipcRenderer.sendMessage('quit-and-upgrade', reqid);
  });
}

type OnDownloadFunc = (payload: IAppUpdatorDownloadProgress) => void;
async function startDownload({
  onDownload,
}: {
  onDownload?: OnDownloadFunc;
} = {}) {
  const reqid = randString();

  return new Promise<void>((resolve, reject) => {
    const disposePending = window.rabbyDesktop.ipcRenderer.on(
      'download-release-progress-updated',
      (event) => {
        onDownload?.(event.download);
        if (event.download.isEnd) {
          disposePending?.();
        }
      }
    );

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

const releaseCheckInfoAtom = atom({
  hasNewRelease: false,
  releaseVersion: null,
} as IAppUpdatorCheckResult);
const downloadInfoAtom = atom(null as null | IAppUpdatorDownloadProgress);

export function useCheckNewRelease(opts?: { isWindowTop?: boolean }) {
  const { isWindowTop } = opts || {};
  const [releaseCheckInfo, setReleaseCheckInfo] = useAtom(releaseCheckInfoAtom);

  const fetchReleaseInfo = useCallback(async () => {
    // eslint-disable-next-line promise/catch-or-return
    const newVal = await checkIfNewRelease();
    setReleaseCheckInfo(newVal);
  }, [setReleaseCheckInfo]);

  useEffect(() => {
    fetchReleaseInfo();
    if (!isWindowTop) {
      return;
    }

    const timer = setInterval(() => {
      fetchReleaseInfo();
    }, 1000 * 60 * 60 * 0.5);

    return () => {
      clearInterval(timer);
    };
  }, [isWindowTop, fetchReleaseInfo, setReleaseCheckInfo]);

  return {
    hasNewRelease: releaseCheckInfo.hasNewRelease,
    releaseCheckInfo,
    setReleaseCheckInfo,
    fetchReleaseInfo,
  };
}

export function useAppUpdator() {
  const [releaseCheckInfo] = useAtom(releaseCheckInfoAtom);
  const [downloadInfo, setDownloadInfo] = useAtom(downloadInfoAtom);

  const onDownload: OnDownloadFunc = useCallback(
    (info) => {
      setDownloadInfo(info);
    },
    [setDownloadInfo]
  );

  const requestDownload = useCallback(async () => {
    await startDownload({ onDownload });
  }, [onDownload]);

  return {
    releaseCheckInfo,
    isDownloading: !!downloadInfo && !downloadInfo.isEnd,
    isDownloaded:
      releaseCheckInfo.hasNewRelease && !!downloadInfo && downloadInfo.isEnd,
    progress: downloadInfo?.progress,
    requestDownload,
    downloadInfo,
    quitAndUpgrade,
  };
}
