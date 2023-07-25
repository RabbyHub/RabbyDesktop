import { useEffect, useRef } from 'react';
import { atom, useAtom } from 'jotai';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { ShellWalletType, makeShellWallet } from '../utils-shell/shell-wallet';

const shellWalletAtom = atom(null as any as ShellWalletType);

/**
 * @description make sure you component is child of <ShellWalletProvider />
 *
 */
export function useShellWallet() {
  const [shellWallet, setShellWallet] = useAtom(shellWalletAtom);

  const instanceRef = useRef<ShellWalletType | null>(shellWallet);
  useEffect(() => {
    if (instanceRef.current) return;

    window.rabbyDesktop?.ipcRenderer
      .invoke('__internal_invoke:rabbyx:waitExtBgGhostLoaded')
      .then(({ rabbyxExtId }) => {
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
