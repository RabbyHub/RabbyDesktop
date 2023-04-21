import { useCallback, useLayoutEffect, useRef } from 'react';
import { ucfirst } from '@/isomorphic/string';
import { APP_BRANDNAME } from '@/isomorphic/constants';
import { useZPopupViewState } from '../hooks/usePopupWinOnMainwin';
import { ModalConfirmInSettings } from '../components/Modal/Confirm';
import { forwardMessageTo } from '../hooks/useViewsMessage';

const TREZOR_LIKE_KEY = 'trezor-like-cannot-use' as const;
export function useTipCannotUseTrezorLike() {
  const modalRef = useRef<null | ReturnType<typeof ModalConfirmInSettings>>(
    null
  );

  const { svVisible, svState, delayCloseSubview } =
    useZPopupViewState(TREZOR_LIKE_KEY);

  const clear = useCallback(() => {
    modalRef.current?.destroy();
    modalRef.current = null;
  }, []);

  useLayoutEffect(() => {
    if (svVisible) {
      clear();

      modalRef.current = ModalConfirmInSettings({
        height: 250,
        closable: true,
        onCancel: () => {
          delayCloseSubview(150);
        },
        ...(svState?.reasonType === 'used-one' && {
          title: `Unable to use ${ucfirst(svState.cannotUse)}`,
          content: (
            <>
              You have used {ucfirst(svState.haveUsed)}, which is in conflict
              with {ucfirst(svState.cannotUse)}. To connect with{' '}
              {ucfirst(svState.cannotUse)}, please restart the {APP_BRANDNAME}.
            </>
          ),
          okText: 'Restart',
          onOk: () => {
            window.rabbyDesktop.ipcRenderer.invoke(
              'app-relaunch',
              'trezor-like-used'
            );
          },
        }),
        ...(svState?.reasonType === 'enabled-ipfs' && {
          title: `Unable to use ${ucfirst(svState.cannotUse)}`,
          content: (
            <>
              When Decentralized app is enabled, {ucfirst(svState.cannotUse)}{' '}
              can't be used properly. To use {ucfirst(svState.cannotUse)},
              please disable Decentralized app in "Settings"
            </>
          ),
          okText: 'Go to Settings',
          onOk: () => {
            delayCloseSubview(150);
            forwardMessageTo('main-window', 'route-navigate', {
              data: {
                pathname: '/mainwin/settings',
                params: {},
              },
            });
          },
        }),
      });
    } else {
      clear();
    }
  }, [svVisible, delayCloseSubview, svState, clear]);
}
