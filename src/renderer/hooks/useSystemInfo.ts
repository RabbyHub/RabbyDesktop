import { useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import { detectClientOS } from '@/isomorphic/os';
import { SYSTEM_REQUIREMENT_MINIMUM } from '@/isomorphic/constants';

const systemReleaseInfoAtom = atom<ISystemReleaseInfo | null>(null);

const osType = detectClientOS();

export const ABOVE_TEXT =
  osType === 'win32'
    ? `Windows ${SYSTEM_REQUIREMENT_MINIMUM.win32} or above`
    : `macOS ${SYSTEM_REQUIREMENT_MINIMUM.darwin} or above`;

const FULL_ABOVE_TEXT = `Please install Rabby Wallet on ${ABOVE_TEXT} \n
Stability and user experience cannot be guaranteed on other version`;

export function useSystemReleaseInfo() {
  const [systemReleaseInfo, setSystemReleaseInfo] = useAtom(
    systemReleaseInfoAtom
  );

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer
      .invoke('get-system-release-info')
      .then((res) => {
        setSystemReleaseInfo({
          ...res.systemReleaseInfo,
        });
      });
  }, [setSystemReleaseInfo]);

  return {
    ...systemReleaseInfo,
    aboveText: ABOVE_TEXT,
    fullAboveText: FULL_ABOVE_TEXT,
  };
}
