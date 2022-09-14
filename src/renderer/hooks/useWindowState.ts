import { useCallback, useEffect, useState } from 'react';
import { detectOS } from '../../isomorphic/os';

const OS_TYPE = detectOS();

export function useWindowState () {
  const [winState, setWinState] = useState<chrome.windows.windowStateEnum | void>();

  useEffect(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      setWinState(win.state);
    })
  }, []);

  const onMinimizeButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      const nextState = win.state === 'minimized' ? 'normal' : 'minimized';
      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, []);
  const onMaximizeButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      const nextState = win.state === 'maximized' ? 'normal' : 'maximized';
      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, []);

  const onFullscreenButton = useCallback(() => {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      const nextState = win.state === 'fullscreen' ? 'normal' : 'fullscreen';
      setWinState(nextState);
      chrome.windows.update(win.id!, {
        state: nextState,
      });
    });
  }, []);

  const onCloseButton = useCallback(() => {
    chrome.windows.remove(undefined as any);
  }, []);

  return {
    osType: OS_TYPE,
    winState,
    onMinimizeButton,
    onMaximizeButton,
    onFullscreenButton,
    onCloseButton,
  }
}
