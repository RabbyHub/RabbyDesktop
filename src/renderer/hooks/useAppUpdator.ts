/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import localCurrentVersionReleaseNote from '@/renderer/changeLogs/currentVersion.md';
import { randString } from '../../isomorphic/string';
import { getReleaseNoteByVersion } from '../ipcRequest/app';
import { useAppVersion } from './useMainBridge';
import { copyText } from '../utils/clipboard';

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

const checkConnectionAtom = atom<IAppUpdatorProcessStep>('wait');
const downloadStepAtom = atom<IAppUpdatorProcessStep>('wait');
const verifyStepAtom = atom<IAppUpdatorProcessStep>('wait');
const appUpdateURlAtom = atom<string>('');

export function useCurrentVersionReleaseNote() {
  // const [currentVersionReleaseNote, setCurrentVersionReleaseNote] =
  //   useState<string>(localCurrentVersionReleaseNote);

  // const fetchCurrentVersionReleaseNote = useCallback(async () => {
  //   const res = await getReleaseNoteByVersion();
  //   const releaseNote = res.result?.trim();
  //   if (releaseNote) {
  //     setCurrentVersionReleaseNote(releaseNote);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchCurrentVersionReleaseNote();
  // }, [fetchCurrentVersionReleaseNote]);

  const appVerisons = useAppVersion();
  const versionTextToShow = useMemo(() => {
    return [
      `${appVerisons.version || '-'}`,
      appVerisons.appChannel === 'prod' ? '' : `-${appVerisons.appChannel}`,
      appVerisons.appChannel === 'prod' ? '' : ` (${appVerisons.gitRef})`,
    ]
      .filter(Boolean)
      .join('');
  }, [appVerisons]);

  const copyCurrentVersionInfo = useCallback(() => {
    copyText(
      [
        `Version: ${appVerisons.version || '-'}`,
        `Channel: ${appVerisons.appChannel}`,
        `Revision: ${appVerisons.gitRef}`,
      ].join('; ')
    );
  }, [appVerisons.version, appVerisons.appChannel, appVerisons.gitRef]);

  return {
    versionTextToShow,
    copyCurrentVersionInfo,
    currentVersionReleaseNote: localCurrentVersionReleaseNote,
    appVersion: window.rabbyDesktop.appVersion,
  };
}

export function useCheckNewRelease(opts?: { isWindowTop?: boolean }) {
  const { isWindowTop } = opts || {};
  const [releaseCheckInfo, setReleaseCheckInfo] = useAtom(releaseCheckInfoAtom);

  const fetchLatestReleaseInfo = useCallback(async () => {
    // eslint-disable-next-line promise/catch-or-return
    const newVal = await checkIfNewRelease();
    setReleaseCheckInfo(newVal);

    return newVal;
  }, [setReleaseCheckInfo]);

  useEffect(() => {
    fetchLatestReleaseInfo();
    if (!isWindowTop) {
      return;
    }

    const timer = setInterval(() => {
      fetchLatestReleaseInfo();
    }, 1000 * 60 * 60 * 0.5);

    return () => {
      clearInterval(timer);
    };
  }, [isWindowTop, fetchLatestReleaseInfo, setReleaseCheckInfo]);

  return {
    hasNewRelease: releaseCheckInfo.hasNewRelease,
    releaseCheckInfo,
    setReleaseCheckInfo,
    fetchLatestReleaseInfo,
  };
}

const isMockFailed = {
  Connected: !IS_RUNTIME_PRODUCTION && false,
  Download: !IS_RUNTIME_PRODUCTION && false,
  Verify: !IS_RUNTIME_PRODUCTION && false,
};

export function useUpdateAppStates() {
  const [stepCheckConnected, setStepCheckConnected] =
    useAtom(checkConnectionAtom);
  const [stepDownloadUpdate, setStepDownloadUpdate] = useAtom(downloadStepAtom);
  const [stepVerification, setStepVerification] = useAtom(verifyStepAtom);

  return {
    stepCheckConnected,
    setStepCheckConnected,
    stepDownloadUpdate,
    setStepDownloadUpdate,
    stepVerification,
    setStepVerification,
  };
}

export function useAppUpdator() {
  const [releaseCheckInfo] = useAtom(releaseCheckInfoAtom);
  const [downloadInfo, setDownloadInfo] = useAtom(downloadInfoAtom);
  const [appUpdateURL, setAppUpdateURL] = useAtom(appUpdateURlAtom);

  const {
    stepCheckConnected,
    setStepCheckConnected,
    stepDownloadUpdate,
    setStepDownloadUpdate,
    stepVerification,
    setStepVerification,
  } = useUpdateAppStates();

  const onDownload: OnDownloadFunc = useCallback(
    (info) => {
      // mock failed
      if (isMockFailed.Download) {
        info = { progress: null, isEnd: true, downloadFailed: true };
      }

      setDownloadInfo(info);
      setStepDownloadUpdate(
        info?.isEnd ? (info?.downloadFailed ? 'error' : 'finish') : 'process'
      );
    },
    [setDownloadInfo, setStepDownloadUpdate]
  );

  const requestDownload = useCallback(async () => {
    await startDownload({ onDownload });
    setStepDownloadUpdate('process');
  }, [onDownload, setStepDownloadUpdate]);

  const checkDownloadAvailble = useCallback(async () => {
    setStepCheckConnected('process');
    setStepDownloadUpdate('process');

    let isValid = false;

    try {
      const [res] = await Promise.all([
        window.rabbyDesktop.ipcRenderer.invoke('check-download-availble'),
        // await 1second
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        }),
      ]);

      if (isMockFailed.Connected) res.isValid = false;
      isValid = res.isValid;

      setAppUpdateURL(res.downloadURL);
    } catch (err) {
      isValid = false;
    }
    setStepCheckConnected(isValid ? 'finish' : 'error');
    if (!isValid) {
      setStepDownloadUpdate('wait');
    }

    return isValid;
  }, [setAppUpdateURL, setStepCheckConnected, setStepDownloadUpdate]);

  const isVerifyingRef = useRef(false);
  const verifyDownloadedPackage = useCallback(async () => {
    if (stepDownloadUpdate !== 'finish') {
      console.error(`stepDownloadUpdate is not finish`);
      return false;
    }

    if (isVerifyingRef.current) return;

    isVerifyingRef.current = true;

    setStepVerification('process');
    try {
      const [res] = await Promise.all([
        window.rabbyDesktop.ipcRenderer.invoke('verify-update-package'),
        // await 2second
        new Promise<void>((resolve) => {
          setTimeout(resolve, 2000);
        }),
      ]);

      if (isMockFailed.Verify) res.isValid = false;

      setStepVerification(res.isValid ? 'finish' : 'error');
      return res.isValid;
    } catch (err) {
      setStepVerification('error');
    } finally {
      isVerifyingRef.current = true;
    }

    return false;
  }, [stepDownloadUpdate, setStepVerification]);

  return {
    appUpdateURL,
    releaseCheckInfo,
    stepCheckConnected,
    checkDownloadAvailble,

    stepDownloadUpdate,
    stepVerification,
    isDownloaded:
      releaseCheckInfo.hasNewRelease && !!downloadInfo && downloadInfo.isEnd,
    isDownloadedFailed: downloadInfo?.isEnd && !!downloadInfo.downloadFailed,
    /**
     * @deprecated use stepDownloadUpdate instead
     */
    isDownloading: stepDownloadUpdate === 'process',
    progress: downloadInfo?.progress,
    requestDownload,
    downloadInfo,
    quitAndUpgrade,
    verifyDownloadedPackage,
  };
}
