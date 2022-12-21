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

export function navigateToDappRoute(
  navigate: ReturnType<
    typeof import('react-router-dom').createMemoryRouter
  >['navigate'],
  origin: string
) {
  navigate(`/mainwin/dapps/${encodeURIComponent(origin)}`);
}
