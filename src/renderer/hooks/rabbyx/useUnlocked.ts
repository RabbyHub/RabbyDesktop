import { useSubscribeRpm } from '@/renderer/hooks-shell/useShellWallet';
import { walletController } from '@/renderer/ipcRequest/rabbyx';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

const isUnlockedAtom = atom(true);

export function useUnlocked(isTop = false) {
  const [isUnlocked, setIsUnlocked] = useAtom(isUnlockedAtom);

  useEffect(() => {
    if (isTop) return;

    walletController.isUnlocked().then((nextVal) => {
      setIsUnlocked(nextVal);
    });
  }, [isTop, setIsUnlocked]);

  return {
    isUnlocked,
    setIsUnlocked,
  };
}

/**
 * @description make sure ONLY call this hook in the top level of whole page-level app
 */
export function useAppUnlockEvents() {
  const { setIsUnlocked } = useUnlocked(false);

  const subscribeRpm = useSubscribeRpm();

  useEffect(() => {
    return subscribeRpm((payload) => {
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
    });
  }, [subscribeRpm, setIsUnlocked]);
}
