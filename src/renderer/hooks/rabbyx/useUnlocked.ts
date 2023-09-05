import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

const isUnlockedAtom = atom(false);

export function useLockWallet() {
  // const { setIsUnlocked } = useUnlocked({ disableAutoFetch: true });

  const lockWallet = useCallback(async () => {
    await walletController.lockWallet();

    /**
     * you don't need change local state here, because the event
     * will be fired & processed in useAppUnlockEvents
     */
    // setIsUnlocked(true);
  }, []);

  return {
    lockWallet,
  };
}

export function useUnlocked(options?: { disableAutoFetch?: boolean }) {
  const { disableAutoFetch = true } = options || {};
  const [isUnlocked, setIsUnlocked] = useAtom(isUnlockedAtom);

  const fetchUnlocked = useCallback(async () => {
    const nextVal = await walletController.isUnlocked();
    setIsUnlocked(nextVal);
    return nextVal;
  }, [setIsUnlocked]);

  useEffect(() => {
    if (disableAutoFetch) return;

    fetchUnlocked();
  }, [disableAutoFetch, fetchUnlocked]);

  return {
    isUnlocked,
    setIsUnlocked,
    fetchUnlocked,
  };
}

/**
 * @description make sure ONLY call this hook in the top level of whole page-level app
 */
export function useAppUnlockEvents(options?: {
  onChange?(ctx: { nextIsUnlocked: boolean }): void;
}) {
  const { setIsUnlocked } = useUnlocked();

  const { onChange } = options || {};

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
      (payload) => {
        switch (payload.event) {
          default:
            break;
          case 'lock': {
            setIsUnlocked(false);
            onChange?.({ nextIsUnlocked: false });
            break;
          }
          case 'unlock': {
            setIsUnlocked(true);
            onChange?.({ nextIsUnlocked: false });
            break;
          }
        }
      }
    );
  }, [setIsUnlocked, onChange]);
}
