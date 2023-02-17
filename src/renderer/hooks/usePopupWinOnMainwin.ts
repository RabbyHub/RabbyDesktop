import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { randString } from '@/isomorphic/string';
import { parseQueryString } from '@/isomorphic/url';
import { hideMainwinPopup } from '../ipcRequest/mainwin-popup';
import {
  hideMainwinPopupview,
  showMainwinPopupview,
} from '../ipcRequest/mainwin-popupview';
import { useForwardTo, useMessageForwarded } from './useViewsMessage';
import {
  consumeZCallback,
  IZCallback,
  registerZCallback,
} from '../ipcRequest/zPopupMessage';

export function usePopupWinInfo<T extends IPopupWinPageInfo['type']>(
  type: T,
  opts?: {
    enableTopViewGuard?: boolean;
  }
) {
  const [localVisible, setLocalVisible] = useState(false);

  const [info, setInfo] = useState<{
    visible: boolean;
    pageInfo: (IPopupWinPageInfo & { type: typeof type }) | null;
  }>({
    visible: false,
    pageInfo: null,
  });

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:popupwin-on-mainwin:on-visiblechange',
      (payload) => {
        if (payload.type !== type) return;

        if (payload.visible) {
          setInfo({
            visible: true,
            pageInfo: payload.pageInfo as any,
          });
          setLocalVisible(true);
        } else {
          setLocalVisible(false);
          setInfo({
            visible: false,
            pageInfo: null,
          });
        }
      }
    );
  }, [type]);

  const hideWindow = useCallback(() => {
    setLocalVisible(false);
    hideMainwinPopup(type);
  }, [type]);

  const hideWindowOnly = useCallback(() => {
    hideMainwinPopup(type);
  }, [type]);

  const localVisibleRef = useRef(localVisible);
  useEffect(() => {
    const prev = localVisibleRef.current;
    if (opts?.enableTopViewGuard && prev && !localVisible) {
      hideWindowOnly();
    }

    localVisibleRef.current = localVisible;

    return () => {
      localVisibleRef.current = false;
    };
  }, [opts?.enableTopViewGuard, localVisible, hideWindowOnly]);

  return {
    localVisible,
    setLocalVisible,
    hideWindow,
    hideWindowOnly,
    visible: info.visible,
    pageInfo: info.pageInfo,
  };
}
export function usePopupViewInfo<T extends IPopupViewChanges['type']>(
  type: T,
  opts?: {
    enableTopViewGuard?: boolean;
    onVisibleChanged?: (payload: IPopupViewChanges<T>) => void;
  }
) {
  const [localVisible, setLocalVisible] = useState(false);

  const [info, setInfo] = useState<{
    visible: boolean;
    pageInfo: (PopupViewOnMainwinInfo & { type: typeof type }) | null;
  }>({
    visible: false,
    pageInfo: null,
  });

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:popupview-on-mainwin:on-visiblechange',
      (payload) => {
        if (payload.type !== type) return;

        if (payload.visible) {
          setInfo({
            visible: true,
            pageInfo: payload.pageInfo as any,
          });
          setLocalVisible(true);
        } else {
          setLocalVisible(false);
          setInfo({
            visible: false,
            pageInfo: null,
          });
        }

        opts?.onVisibleChanged?.(payload as any);
      }
    );
  }, [type, opts, opts?.onVisibleChanged]);

  const hideView = useCallback(() => {
    setLocalVisible(false);
    hideMainwinPopupview(type);
  }, [type]);

  const hideViewOnly = useCallback(() => {
    hideMainwinPopupview(type);
  }, [type]);

  const localVisibleRef = useRef(localVisible);
  useEffect(() => {
    const prev = localVisibleRef.current;
    if (opts?.enableTopViewGuard && prev && !localVisible) {
      hideViewOnly();
    }

    localVisibleRef.current = localVisible;

    return () => {
      localVisibleRef.current = false;
    };
  }, [opts?.enableTopViewGuard, localVisible, hideViewOnly]);

  return {
    localVisible,
    setLocalVisible,
    hideView,
    hideViewOnly,
    visible: info.visible,
    pageInfo: info.pageInfo,
  };
}

const isInZPopup = parseQueryString().view === 'z-popup';
/**
 * @description provide actions to operate z-popup on main views
 * @returns
 */
export function useZPopupLayerOnMain() {
  const sendMsg = useForwardTo('z-popup');

  const updateZPopup = useCallback(
    <V extends keyof ZViewStates>(
      svType: V,
      visible: boolean,
      svPartials?: ZViewStates[V]
    ) => {
      const partials = {
        [svType]: {
          visible,
          state: svPartials,
        },
      };

      sendMsg('update-subview-state', {
        partials,
      });
    },
    [sendMsg]
  );

  const showZSubview = useCallback(
    <V extends keyof ZViewStates>(
      svType: V,
      svPartials?: ZViewStates[V],
      callback?: IZCallback<V>
    ) => {
      updateZPopup(svType, true, svPartials);

      let svOpenId = randString();
      if (typeof callback === 'function') {
        svOpenId = registerZCallback(svType, callback).svOpenId;
      }
      sendMsg('register-subview-openid', {
        payload: { svOpenId, subView: svType },
      });
    },
    [updateZPopup, sendMsg]
  );

  const hideZSubview = useCallback(
    <V extends keyof ZViewStates>(svType: V) => {
      updateZPopup(svType, false);
    },
    [updateZPopup]
  );

  return {
    showZSubview,
    hideZSubview,
  };
}

const ZPopupSubviewStateAtom = atom<NullableFields<IZPopupSubviewState>>({
  'switch-chain': null,
  'security-notification': null,
  'add-address-dropdown': null,
  'add-address-modal': null,
  'address-management': null,
  'address-detail': null,
  'select-add-address-type-modal': null,
});

export function useZPopupViewStates() {
  const [zviewsState, setZViewsState] = useAtom(ZPopupSubviewStateAtom);

  return { zviewsState, setZViewsState };
}
export function useZPopupViewState<T extends keyof ZViewStates>(
  svType: T,
  onFieldsChanged?: (partials?: IZPopupSubviewState[T]) => void
) {
  const { zviewsState, setZViewsState } = useZPopupViewStates();
  const broadcastMsg = useForwardTo('*');

  useMessageForwarded(
    {
      type: 'update-subview-state',
      targetView: 'z-popup',
    },
    (payload) => {
      const { partials } = payload;
      if (!partials) return;
      if (!partials[svType]) return;

      onFieldsChanged?.(partials[svType]);
    }
  );

  const closeSubview = useCallback(() => {
    setZViewsState((prev) => {
      const partials = {
        ...prev,
        [svType]: {
          ...prev[svType],
          visible: false,
        },
      };

      const svOpenId = consumeZCallback(svType);
      broadcastMsg('consume-subview-openid', {
        payload: {
          svOpenId,
          subView: svType,
          latestState: partials[svType]?.state,
          $subViewState: partials[svType],
        },
      });

      if (Object.values(partials).every((v) => !v?.visible)) {
        hideMainwinPopupview('z-popup');
      }

      return partials;
    });
  }, [svType, setZViewsState, broadcastMsg]);

  const { visible: svVisible, state: svState } = zviewsState[svType] || {};

  const setSvState = useCallback(
    (svPartials: IZPopupSubviewState[T]['state']) => {
      setZViewsState((prev) => {
        const partials = {
          ...prev,
          [svType]: {
            ...prev[svType],
            state: svPartials,
          },
        };

        return partials;
      });
    },
    [svType, setZViewsState]
  );

  return {
    setSvState,
    svVisible: !!svVisible,
    svState,
    /**
     * @deprecated for compatibility
     */
    pageInfo: zviewsState[svType],
    closeSubview,
  };
}
