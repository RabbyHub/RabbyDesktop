import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

const desktopAppStateAtom = atom(null as IDesktopAppState | null);

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

  const toggleSidebarCollapsed = useCallback(
    async (nextVal: boolean) => {
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
