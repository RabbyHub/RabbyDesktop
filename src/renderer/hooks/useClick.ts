import { RefObject, useCallback, useEffect, useLayoutEffect } from 'react';
import { hideMainwinPopup } from '../ipcRequest/mainwin-popup';

export function useClickOutSide(
  ref: RefObject<HTMLElement>,
  callback: (e: MouseEvent) => void
) {
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback(e);
      }
    },
    [ref, callback]
  );

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [handleClick]);
}

export function useClickMainWindowHideContextMenu() {
  useLayoutEffect(() => {
    const listener = () => {
      hideMainwinPopup('sidebar-dapp-contextmenu');
    };
    document.body.addEventListener('click', listener);

    return () => {
      document.body.removeEventListener('click', listener);
    };
  }, []);
}
