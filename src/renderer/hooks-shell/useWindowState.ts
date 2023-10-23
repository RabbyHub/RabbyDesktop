import {
  isForSpecialHardwareWebUI,
  isMainWinShellWebUI,
} from '@/isomorphic/url';
import { detectClientOS } from '@/isomorphic/os';
import { useCallback, useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import { useMainWindowEventsToast } from './useMainWindowEvents';
import { useInterval } from '../hooks/useTimer';
import { getPerfInfo } from '../utils/performance';

const OS_TYPE = detectClientOS();
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
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, async (win) => {
      /**
       * @notice just for robust, but we don't expect this to happen,
       * make sure minimize button is disabled when window is fullscreen on darwin
       */
      if (isDarwin && winState === 'fullscreen') {
        await chrome.windows.update(win.id!, {
          state: 'normal',
        });
      }

      const nextState = 'minimized';
      await chrome.windows.update(win.id!, {
        state: nextState,
      });
      setWinState(nextState);
    });
  }, [winState, setWinState]);
  const onWindowsMaximizeButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, async (win) => {
      const nextState = winState === 'maximized' ? 'normal' : 'maximized';

      await chrome.windows.update(win.id!, {
        state: nextState,
      });
      setWinState(nextState);
    });
  }, [winState, setWinState]);

  const onDarwinToggleMaxmize = useCallback(() => {
    if (!isDarwin) return;

    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, async (win) => {
      /**
       * implement:
       * - if dock is fullfilled, restore window to its last size before maximize
       * - if dock is not fullfilled, maximize window(dock-fullfilled)
       */
      const scrInfo = await window.rabbyDesktop.ipcRenderer.invoke(
        'get-darwin-mainwindow-screen-info'
      );

      if (!scrInfo.isDockFullfilled) {
        await window.rabbyDesktop.ipcRenderer.invoke(
          'memoize-darwin-mainwindow-screen-info'
        );
        await chrome.windows.update(win.id!, {
          state: 'maximized',
        });
        setWinState('maximized');
      } else {
        await window.rabbyDesktop.ipcRenderer.invoke(
          'restore-darwin-mainwin-bounds',
          {}
        );
        await chrome.windows.update(win.id!, {
          state: 'normal',
        });
        setWinState('normal');
      }
    });
  }, [setWinState]);

  const onFullscreenButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, async (win) => {
      const nextState = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
      await chrome.windows.update(win.id!, {
        state: nextState,
      });
      setWinState(nextState);
    });
  }, [setWinState]);

  const onCloseButton = useCallback(() => {
    if (isMainWinShellWebUI(window.location.href)) {
      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_rpc:mainwindow:click-close'
      );
      return;
    }
    if (isForSpecialHardwareWebUI(window.location.href)) {
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
    disabledMinimizeButton: isDarwin && winState === 'fullscreen',
    onMinimizeButton,
    onWindowsMaximizeButton,
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

  useInterval(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:browser:report-perf-info',
      getPerfInfo()
    );
  }, 3000);

  useMainWindowEventsToast();
}
