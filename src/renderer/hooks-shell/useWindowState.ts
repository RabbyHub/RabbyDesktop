import { isMainWinShellWebUI } from '@/isomorphic/url';
import { detectOS } from '@/isomorphic/os';
import { useCallback, useEffect, useState } from 'react';
import { atom, useAtom } from 'jotai';

const OS_TYPE = detectOS();
const isDarwin = OS_TYPE === 'darwin';

const winStateAtom = atom<chrome.windows.windowStateEnum | void>(undefined);

export function useWindowState() {
  const [winState, setWinState] = useAtom(winStateAtom);

  useEffect(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      setWinState(win.state);
    });
  }, [setWinState]);

  const onMinimizeButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      const nextState = 'normal';
      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, [setWinState]);
  const onMaximizeButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      /**
       * on darwin, you can not restore a maximized window by
       * clicking the maximize button, or programatically by default,
       * except program rememeber the previous window size and restore it later,
       * we don't implement it for now.
       */
      const nextState =
        win.state === 'maximized' && !isDarwin ? 'normal' : 'maximized';

      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, [setWinState]);

  const onFullscreenButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      const nextState = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, [setWinState]);

  const onCloseButton = useCallback(() => {
    if (!isMainWinShellWebUI(window.location.href)) {
      chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT);
      return;
    }

    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:main-window:click-close'
    );
  }, []);

  return {
    osType: OS_TYPE,
    winState,
    onMinimizeButton,
    onMaximizeButton,
    onToggleMaxmize: onMaximizeButton,
    onFullscreenButton,
    onCloseButton,
  };
}

/**
 * @description make sure ONLY call this hook in the top level of whole page-level app
 */
export function useMainWindowEvents() {
  const [, setWinState] = useAtom(winStateAtom);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:mainwindow:state-changed',
      ({ windowState }) => {
        setWinState(windowState);
      }
    );
  }, [setWinState]);
}
