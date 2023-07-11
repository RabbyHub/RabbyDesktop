import { atom, useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import { DAPP_ZOOM_VALUES } from '@/isomorphic/constants';
import { formatZoomValue } from '@/isomorphic/primitive';
import { toggleMainWinTabAnimating } from '../ipcRequest/mainwin';
import { useIsAnimating } from './useSidebar';

const desktopAppStateAtom = atom(null as IDesktopAppState | null);

// keep sync with css animation var --mainwin-sidebar-animation-second
const SIDEBAR_WIDTH_ANIMATION_SECOND = 0.5;

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

  const toggleEnableIPFSDapp = useCallback(
    async (nextVal: boolean) => {
      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'put-desktopAppState',
        {
          enableServeDappByHttp: nextVal,
        }
      );

      setDesktopAppState((prev) => {
        return {
          ...(prev as IDesktopAppState & object),
          enableServeDappByHttp: result.state.enableServeDappByHttp,
        };
      });
    },
    [setDesktopAppState]
  );

  const adjustDappViewZoomPercent = useCallback(
    async (nextVal: number) => {
      nextVal = formatZoomValue(nextVal).zoomPercent;

      const result = await window.rabbyDesktop.ipcRenderer.invoke(
        'put-desktopAppState',
        {
          experimentalDappViewZoomPercent: nextVal,
        }
      );

      setDesktopAppState((prev) => {
        return {
          ...(prev as IDesktopAppState & object),
          experimentalDappViewZoomPercent:
            result.state.experimentalDappViewZoomPercent,
        };
      });
    },
    [setDesktopAppState]
  );

  const { isAnimating, setIsAnimating } = useIsAnimating();
  const toggleSidebarCollapsed = useCallback(
    async (nextVal: boolean) => {
      await toggleMainWinTabAnimating(true);
      setIsAnimating(true);
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
        setIsAnimating(false);
      }, SIDEBAR_WIDTH_ANIMATION_SECOND * 1000);
    },
    [setDesktopAppState, setIsAnimating]
  );

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return {
    isAnimating,
    settings: {
      enableContentProtected: desktopAppState?.enableContentProtected !== false,
      enableServeDappByHttp: !!desktopAppState?.enableServeDappByHttp,
      sidebarCollapsed: Boolean(
        desktopAppState?.sidebarCollapsed ??
          JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false')
      ),
      experimentalDappViewZoomPercent:
        desktopAppState?.experimentalDappViewZoomPercent ??
        DAPP_ZOOM_VALUES.DEFAULT_ZOOM_PERCENT,
    },
    fetchState,
    toggleEnableContentProtection,
    toggleEnableIPFSDapp,
    toggleSidebarCollapsed,
    adjustDappViewZoomPercent,
  };
}

const mediaAboutAtom = atom({
  selectedMediaConstrains: null,
  cameraAccessStatus: 'denied',
} as Pick<IDesktopAppState, 'selectedMediaConstrains'> & {
  cameraAccessStatus: IDarwinMediaAccessStatus;
});
export function useSelectedMedieDevice() {
  const [mediaAboutState, setMediaAboutState] = useAtom(mediaAboutAtom);

  const fetchCameraAccessStatus = useCallback(async () => {
    const { accessStatus: cameraAccessStatus } =
      await window.rabbyDesktop.ipcRenderer.invoke(
        'get-media-access-status',
        'camera'
      );

    setMediaAboutState((prev) => ({ ...prev, cameraAccessStatus }));

    return { cameraAccessStatus };
  }, [setMediaAboutState]);

  const fetchSelectedMediaConstrains = useCallback(async () => {
    const result = await window.rabbyDesktop.ipcRenderer.invoke(
      'get-desktopAppState'
    );

    setMediaAboutState((prev) => ({
      ...prev,
      selectedMediaConstrains: result.state.selectedMediaConstrains,
    }));
  }, [setMediaAboutState]);

  const setLocalConstrains = useCallback(
    (constrains: IDesktopAppState['selectedMediaConstrains']) => {
      setMediaAboutState((prev) => {
        return {
          ...prev,
          selectedMediaConstrains: {
            label: constrains?.label || null,
            ...constrains,
          },
        };
      });
    },
    [setMediaAboutState]
  );

  useEffect(() => {
    fetchSelectedMediaConstrains();
    fetchCameraAccessStatus();
  }, [fetchSelectedMediaConstrains, fetchCameraAccessStatus]);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:media:events',
      (payload) => {
        switch (payload.eventType) {
          case 'push-selected-media-video': {
            setLocalConstrains(payload.constrains);
            break;
          }
          default:
            break;
        }
      }
    );
  }, [setLocalConstrains]);

  return {
    cameraAccessStatus: mediaAboutState.cameraAccessStatus || 'denied',
    selectedMediaConstrains: mediaAboutState.selectedMediaConstrains || null,
    fetchSelectedMediaConstrains,
    fetchCameraAccessStatus,
    setLocalConstrains,
  };
}
