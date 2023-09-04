import { formatDappURLToShow, makeDappURLToOpen } from '@/isomorphic/dapp';
import { useCallback } from 'react';
import { useMatchDappByOrigin } from './useDappsMngr';
import { useOpenDapp } from '../utils/react-router';

export const useDappOriginInfo = (origin: string) => {
  const dapp = useMatchDappByOrigin(makeDappURLToOpen(origin));
  const _openDapp = useOpenDapp();
  const dappOrigin = dapp?.origin || origin;

  const openDapp = useCallback(() => {
    _openDapp(dappOrigin, { dontReloadOnSwitchToActiveTab: true });
  }, [dappOrigin, _openDapp]);

  const url = formatDappURLToShow(
    dapp?.type === 'localfs' ? dapp.id : dappOrigin
  );

  return {
    dapp,
    url: url.startsWith('chrome-extension://') ? undefined : url,
    openDapp,
  };
};
