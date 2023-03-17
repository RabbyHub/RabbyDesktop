import { isBuiltinView } from '@/isomorphic/url';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForwardTo } from '../hooks/useViewsMessage';
import { matomoRequestEvent } from './matomo-request';

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

const isMainWindow = isBuiltinView(window.location.href, 'main-window');
export function useOpenDapp() {
  const navigateToDapp = useNavigateToDappRoute();
  const forwardToMain = useForwardTo('main-window');

  return useCallback(
    (dappUrl: string) => {
      if (!isMainWindow) {
        forwardToMain('open-dapp', { data: { dappURL: dappUrl } });
        return;
      }

      window.rabbyDesktop.ipcRenderer
        .invoke('safe-open-dapp-tab', dappUrl)
        .then(({ shouldNavTabOnClient, openType }) => {
          if (shouldNavTabOnClient) {
            navigateToDapp(dappUrl);
          }
          if (openType === 'create-tab') {
            matomoRequestEvent({
              category: 'My Dapp',
              action: 'Visit Dapp',
              label: dappUrl,
            });
          }
        });
    },
    [navigateToDapp, forwardToMain]
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
