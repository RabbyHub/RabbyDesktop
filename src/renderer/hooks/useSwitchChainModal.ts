import { useMemo, useRef } from 'react';
import { CHAINS_ENUM } from '@debank/common';
import { useClickOutSide } from './useClick';
import { useZPopupLayerOnMain } from './usePopupWinOnMainwin';

export const useSwitchChainModal = <T extends HTMLElement>(
  cb?: (c: CHAINS_ENUM) => void,
  onCancelCb?: () => void,
  clickOutSide = true
) => {
  const ref = useRef<T>(null);
  const ZActions = useZPopupLayerOnMain();

  useClickOutSide(ref, () => {
    if (clickOutSide) {
      ZActions.hideZSubview('switch-chain');
    }
  });

  return useMemo(
    () => ({
      ref,
      open: (svPartials?: ZViewStates['switch-chain']) =>
        ZActions.showZSubview(
          'switch-chain',
          {
            value: CHAINS_ENUM.ETH,
            ...svPartials,
          },
          (payload) => {
            if (payload.latestState?.isCancel) {
              onCancelCb?.();
            } else {
              cb?.(payload.latestState?.value || CHAINS_ENUM.ETH);
            }
          }
        ),
    }),
    [ZActions, cb, onCancelCb]
  );
};
