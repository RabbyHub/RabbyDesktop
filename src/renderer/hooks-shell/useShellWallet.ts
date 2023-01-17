import { useEffect, useRef } from 'react';
import { atom, useAtom } from 'jotai';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { waitRabbyXGhostBgLoaded } from '../ipcRequest/rabbyx';
import { makeShellWallet } from '../utils-shell/shell-wallet';

type ShellWalletType = ReturnType<typeof makeShellWallet>;
const shellWalletAtom = atom(null as any as ReturnType<typeof makeShellWallet>);

/**
 * @description make sure you component is child of <ShellWalletProvider />
 *
 */
export function useShellWallet() {
  const [shellWallet, setShellWallet] = useAtom(shellWalletAtom);

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

      setShellWallet(wallet);
    });
  }, [setShellWallet]);

  return shellWallet;
}
