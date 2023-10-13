/// <reference path="../../isomorphic/types.d.ts" />
/// <reference path="../../renderer/preload.d.ts" />

import { atom, useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import localCurrentVersionReleaseNote from '@/renderer/changeLogs/currentVersion.md';
import { getRendererAppChannel } from '@/isomorphic/env';
import { randString } from '../../isomorphic/string';
import { useAppVersion } from './useMainBridge';
import { copyText } from '../utils/clipboard';
import { useRefState } from './useRefState';

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

const releaseCheckInfoAtom = atom<IAppUpdatorCheckResult>({
  hasNewRelease: false,
  needAlertUpgrade: false,
  releaseVersion: null,
  releaseNote: null,
});
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

export function useCheckNeedAlertUpgrade(opts?: { isWindowTop?: boolean }) {
  const { isWindowTop } = opts || {};
  const [, setReleaseCheckInfo] = useAtom(releaseCheckInfoAtom);

  const fetch = useCallback(() => {
    window.rabbyDesktop.ipcRenderer
      .invoke('check-need-alert-upgrade')
      .then((res) => {
        setReleaseCheckInfo((prev) => {
          return {
            ...prev,
            needAlertUpgrade: res.needAlertUpgrade,
          };
        });
      });
  }, [setReleaseCheckInfo]);

  useEffect(() => {
    if (!isWindowTop) return;

    const timer = setInterval(fetch, 1000 * 5);

    return () => {
      clearInterval(timer);
    };
  }, [isWindowTop, fetch]);
}

export function useCheckNewRelease(opts?: { isWindowTop?: boolean }) {
  const { isWindowTop } = opts || {};
  const [releaseCheckInfo, setReleaseCheckInfo] = useAtom(releaseCheckInfoAtom);
  const { stateRef, setRefState } =
    useRefState<Promise<IAppUpdatorCheckResult> | null>(null);

  const fetchLatestReleaseInfo = useCallback(async () => {
    if (stateRef.current) return;

    try {
      const p = checkIfNewRelease();
      setRefState(p);
      setReleaseCheckInfo(await p);
    } catch (error) {
      console.error(error);
    } finally {
      setRefState(null);
    }
  }, [setReleaseCheckInfo, stateRef, setRefState]);

  useEffect(() => {
    fetchLatestReleaseInfo();
    if (!isWindowTop) return;

    const timer = setInterval(() => {
      fetchLatestReleaseInfo();
    }, 1000 * 60 * 60 * 0.5);

    return () => {
      clearInterval(timer);
    };
  }, [isWindowTop, fetchLatestReleaseInfo, setReleaseCheckInfo]);

  return {
    hasNewRelease: releaseCheckInfo.hasNewRelease,
    shouldAlertUpgrade:
      releaseCheckInfo.hasNewRelease && releaseCheckInfo.needAlertUpgrade,
    releaseCheckInfo,
    setReleaseCheckInfo,
    fetchLatestReleaseInfo,
  };
}

const MockFailures = {
  Connected: !IS_RUNTIME_PRODUCTION && (false as boolean),
  Download: !IS_RUNTIME_PRODUCTION && (false as boolean),
  Verify: !IS_RUNTIME_PRODUCTION && (false as boolean),
};

const mockFailureAtom = atom(MockFailures);

export function useMockFailure() {
  const [mockFailureValues, setMockFailure] = useAtom(mockFailureAtom);

  const toggleMockFailure = useCallback(
    <T extends keyof typeof MockFailures>(
      k: T,
      nextEnabled = !mockFailureValues[k]
    ) => {
      if (IS_RUNTIME_PRODUCTION && getRendererAppChannel() !== 'reg') return;

      setMockFailure((prev) => ({ ...prev, [k]: nextEnabled }));
    },
    [mockFailureValues, setMockFailure]
  );

  return {
    mockFailureValues,
    toggleMockFailure,
  };
}

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
  const mockFailureValues = useAtomValue(mockFailureAtom);

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
      if (mockFailureValues.Download) {
        info = { progress: null, isEnd: true, downloadFailed: true };
      }

      setDownloadInfo(info);
      setStepDownloadUpdate(
        info?.isEnd ? (info?.downloadFailed ? 'error' : 'finish') : 'process'
      );
    },
    [setDownloadInfo, setStepDownloadUpdate, mockFailureValues.Download]
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
        // await 1.5s
        new Promise<void>((resolve) => {
          setTimeout(resolve, 1500);
        }),
      ]);

      if (mockFailureValues.Connected) res.isValid = false;
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
  }, [
    setAppUpdateURL,
    setStepCheckConnected,
    setStepDownloadUpdate,
    mockFailureValues.Connected,
  ]);

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

      if (mockFailureValues.Verify) res.isValid = false;

      setStepVerification(res.isValid ? 'finish' : 'error');
      return res.isValid;
    } catch (err) {
      setStepVerification('error');
    } finally {
      isVerifyingRef.current = true;
    }

    return false;
  }, [stepDownloadUpdate, setStepVerification, mockFailureValues.Verify]);

  const resetDownloadWork = useCallback(
    (options?: { clearDownloaded?: boolean }) => {
      setStepCheckConnected('wait');
      setStepDownloadUpdate('wait');
      setStepVerification('wait');
      setDownloadInfo(null);

      // if (options?.clearDownloaded) {
      //   window.rabbyDesktop.ipcRenderer.invoke(
      //     '__internal_invoke:app:debug-kits-actions',
      //     { action: 'clean-updates-download-cache' }
      //   );
      // }
    },
    [
      setStepCheckConnected,
      setStepDownloadUpdate,
      setStepVerification,
      setDownloadInfo,
    ]
  );

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
    progress: downloadInfo?.progress,
    requestDownload,
    downloadInfo,
    quitAndUpgrade,
    verifyDownloadedPackage,

    resetDownloadWork,
  };
}
