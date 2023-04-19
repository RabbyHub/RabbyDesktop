import { createContext, useCallback, useEffect, useRef } from 'react';
import { atom, useAtom } from 'jotai';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { waitRabbyXGhostBgLoaded } from '../ipcRequest/rabbyx';
import {
  makeRabbyXPortMessage,
  makeShellWallet,
} from '../utils-shell/shell-wallet';

type ShellWalletType = ReturnType<typeof makeShellWallet>;
type RabbyxPortMessage = ReturnType<typeof makeRabbyXPortMessage>;

type OnRpmMessage = (payload: RabbyXEvent) => void;

let globalRpm = null as any as RabbyxPortMessage;

const rabbyShellAtom = atom({
  shellWallet: null as any as ShellWalletType,
  rpm: null as any as RabbyxPortMessage,
});

const RabbyxShellContext = createContext({
  shellWallet: null as any as ShellWalletType,
  rpm: null as any as RabbyxPortMessage,
});

/**
 * @description make sure you component is child of <ShellWalletProvider />
 *
 */
export function useShellWallet() {
  const [{ shellWallet }, setRabbyShell] = useAtom(rabbyShellAtom);

  const instanceRef = useRef<ShellWalletType | null>(shellWallet);
  useEffect(() => {
    if (instanceRef.current) return;

    waitRabbyXGhostBgLoaded().then(({ rabbyxExtId }) => {
      if (instanceRef.current) return;

      const wallet = makeShellWallet(rabbyxExtId);
      instanceRef.current = wallet;

      if (!IS_RUNTIME_PRODUCTION) {
        (window as any).shellWallet = wallet;
      }

      setRabbyShell((prev) => ({
        ...prev,
        shellWallet: wallet,
      }));
    });
  }, [setRabbyShell]);

  return shellWallet;
}

export function RabbyShellProvider({
  children,
}: React.PropsWithChildren<{
  foo?: string;
}>) {
  const [{ shellWallet, rpm }, setRabbyShell] = useAtom(rabbyShellAtom);

  const isLoadingRef = useRef(!!globalRpm);

  useEffect(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    waitRabbyXGhostBgLoaded()
      .then(({ rabbyxExtId }) => {
        const rabbyxPortMessage = makeRabbyXPortMessage(rabbyxExtId);
        const wallet = makeShellWallet(rabbyxExtId);

        globalRpm = rabbyxPortMessage;

        setRabbyShell((prev) => ({
          ...prev,
          shellWallet: wallet,
          rpm: rabbyxPortMessage,
        }));

        if (!IS_RUNTIME_PRODUCTION) {
          (window as any).rabbyxPortMessage = rabbyxPortMessage;
          (window as any).shellWallet = wallet;
        }
      })
      .finally(() => {
        isLoadingRef.current = !!globalRpm;
      });
  }, [setRabbyShell]);

  return (
    <RabbyxShellContext.Provider
      value={{
        shellWallet,
        rpm,
      }}
    >
      {rpm && shellWallet ? children : null}
    </RabbyxShellContext.Provider>
  );
}

export function useSubscribeRpm() {
  const [{ rpm }] = useAtom(rabbyShellAtom);

  const subscribeRpm = useCallback(
    (onMessage: OnRpmMessage) => {
      rpm?.on('message', onMessage);

      // dispose
      return () => {
        rpm?.off('message', onMessage);
      };
    },
    [rpm]
  );

  return subscribeRpm;
}
