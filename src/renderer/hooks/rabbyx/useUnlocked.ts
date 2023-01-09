import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';

const isUnlockedAtom = atom(false);

export function useUnlocked() {
  const [isUnlocked, setIsUnlocked] = useAtom(isUnlockedAtom);

  useEffect(() => {
    walletController.isUnlocked().then((nextVal) => {
      setIsUnlocked(nextVal);
    });
  }, [setIsUnlocked]);

  return isUnlocked;
}

/**
 * @description make sure ONLY call this hook in the top level of whole page-level app
 */
export function useAppUnlockEvents() {
  const setIsUnlocked = useSetAtom(isUnlockedAtom);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'lock': {
            setIsUnlocked(false);
            break;
          }
          case 'unlock': {
            setIsUnlocked(true);
            break;
          }
        }
      }
    );
  }, [setIsUnlocked]);
}
