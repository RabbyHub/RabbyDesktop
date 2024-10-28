import { createRef, useEffect, useRef } from 'react';
import { atom, useAtom } from 'jotai';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { ShellWalletType, makeShellWallet } from '../utils-shell/shell-wallet';

const shellWalletAtom = atom(null as any as ShellWalletType);
const shellWalletRef = {
  current: null as null | ShellWalletType,
};

export function getUIShellWallet() {
  return shellWalletRef.current;
}
/**
 * @description make sure you component is child of <ShellWalletProvider />
 *
 */
export function useShellWallet() {
  const [shellWallet, setShellWallet] = useAtom(shellWalletAtom);

  useEffect(() => {
    if (shellWalletRef.current) return;

    window.rabbyDesktop?.ipcRenderer
      .invoke('__internal_invoke:rabbyx:waitExtBgGhostLoaded')
      .then(({ rabbyxExtId }) => {
        if (shellWalletRef.current) return;

        const wallet = makeShellWallet(rabbyxExtId);
        shellWalletRef.current = wallet;

        if (!IS_RUNTIME_PRODUCTION) {
          (window as any).shellWallet = wallet;
        }

        setShellWallet(wallet);
      });
  }, [setShellWallet]);

  return shellWallet;
}

export function useTriggerShellWalletOnTop() {
  useShellWallet();
}
