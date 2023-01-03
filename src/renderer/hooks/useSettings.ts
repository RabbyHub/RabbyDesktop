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

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return {
    settings: {
      enableContentProtected: desktopAppState?.enableContentProtected !== false,
    },
    fetchState,
    toggleEnableContentProtection,
  };
}
