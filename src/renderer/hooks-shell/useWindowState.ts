import { isForTrezorLikeWebUI, isMainWinShellWebUI } from '@/isomorphic/url';
import { detectOS } from '@/isomorphic/os';
import { useCallback, useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import { useMessageForwardToMainwin } from '../hooks/useViewsMessage';
import { useMainWindowEventsToast } from './useMainWindowEvents';

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
      const nextState = 'minimized';
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

  const onDarwinToggleMaxmize = useCallback(() => {
    if (!isDarwin) return;

    onMaximizeButton();
  }, [onMaximizeButton]);

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
    if (isMainWinShellWebUI(window.location.href)) {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:main-window:click-close'
      );
      return;
    }
    if (isForTrezorLikeWebUI(window.location.href)) {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:trezor-like-window:click-close'
      );
      return;
    }

    chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT);
  }, []);

  return {
    osType: OS_TYPE,
    winState,
    onMinimizeButton,
    onMaximizeButton,
    onDarwinToggleMaxmize,
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

  useMainWindowEventsToast();
}
