import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { toggleMainWinTabAnimating } from '../ipcRequest/mainwin';

const desktopAppStateAtom = atom(null as IDesktopAppState | null);

// keep sync with css animation var --mainwin-sidebar-animation-second
const SIDEBAR_WIDTH_ANIMATION_SECOND = 0.3;

export function useSettings() {
  const [desktopAppState, setDesktopAppState] = useAtom(desktopAppStateAtom);

  const fetchState = useCallback(async () => {
    const result = await window.rabbyDesktop.ipcRenderer.invoke(
      'get-desktopAppState'
    );

    setDesktopAppState(result.state);
  }, [setDesktopAppState]);

  const toggleEnableContentProtection = useCallback(
    async (nextVal: boolean) => {
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'put-desktopAppState',
        {
          enableContentProtected: nextVal,
        }
      );

      setDesktopAppState((prev) => {
        return {
          ...(prev as IDesktopAppState & object),
          enableContentProtected: result.state.enableContentProtected,
        };
      });
    },
    [setDesktopAppState]
  );

  const animatingRef = useRef(false);
  const toggleSidebarCollapsed = useCallback(
    async (nextVal: boolean) => {
      await toggleMainWinTabAnimating(true);
      animatingRef.current = true;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(nextVal));
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'put-desktopAppState',
        {
          sidebarCollapsed: nextVal,
        }
      );

      setDesktopAppState((prev) => {
        return {
          ...(prev as IDesktopAppState & object),
          sidebarCollapsed: result.state.sidebarCollapsed,
        };
      });
      setTimeout(() => {
        toggleMainWinTabAnimating(false);
        animatingRef.current = false;
      }, SIDEBAR_WIDTH_ANIMATION_SECOND * 1000);
    },
    [setDesktopAppState]
  );

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return {
    settings: {
      enableContentProtected: desktopAppState?.enableContentProtected !== false,
      sidebarCollapsed: Boolean(
        desktopAppState?.sidebarCollapsed ??
          JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false')
      ),
    },
    fetchState,
    toggleEnableContentProtection,
    toggleSidebarCollapsed,
  };
}
