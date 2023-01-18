import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useNavigateToDappRoute() {
  const navigate = useNavigate();

  return useCallback(
    (dappOrigin?: string) => {
      if (!dappOrigin) return;

      navigate(`/mainwin/dapps/${encodeURIComponent(dappOrigin)}`);
    },
    [navigate]
  );
}

export function useOpenDapp() {
  const navigateToDapp = useNavigateToDappRoute();

  return useCallback((dappUrl: string) => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:mainwindow:open-tab',
      dappUrl
    );

    navigateToDapp(dappUrl);
  }, []);
}

export function navigateToDappRoute(
  navigate: ReturnType<
    typeof import('react-router-dom').createMemoryRouter
  >['navigate'],
  origin: string
) {
  navigate(`/mainwin/dapps/${encodeURIComponent(origin)}`);
}
