import { useMemo, useRef } from 'react';
import { CHAINS_ENUM } from '@debank/common';
import { useClickOutSide } from './useClick';
import { useZPopupLayerOnMain } from './usePopupWinOnMainwin';

export const useSwitchChainModal = <T extends HTMLElement>(
  cb?: (c: CHAINS_ENUM) => void,
  options?: {
    onCancelCb?: () => void;
    closeOnClickaway?: boolean;
  }
) => {
  const ref = useRef<T>(null);
  const ZActions = useZPopupLayerOnMain();

  const { onCancelCb, closeOnClickaway } = options || {};

  useClickOutSide(ref, () => {
    if (closeOnClickaway) {
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
