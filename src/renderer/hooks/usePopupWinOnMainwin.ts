import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { randString } from '@/isomorphic/string';
import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { hideMainwinPopup } from '../ipcRequest/mainwin-popup';
import {
  hideMainwinPopupview,
  showMainwinPopupview,
} from '../ipcRequest/mainwin-popupview';
import { useForwardTo, useMessageForwarded } from './useViewsMessage';

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

function noop() {}
type IZCallback<V extends keyof ZViewStates> = (
  payload: IZCallbackPayload<V>
) => any;
const zPopupCallbacks: {
  [K in string]?: {
    subView: keyof ZViewStates;
    callback: IZCallback<keyof ZViewStates>;
  } | null;
} = {};

export function useZPopupCallbackOnMainWindow() {
  useMessageForwarded(
    { targetView: 'main-window', type: 'consume-subview-openid' },
    ({ payload }) => {
      if (!IS_RUNTIME_PRODUCTION) {
        console.debug(
          '[debug] useZPopupCallbackOnMainWindow:: payload',
          payload
        );
      }
      if (
        payload?.svOpenId &&
        zPopupCallbacks[payload.svOpenId]?.subView === payload.subView
      ) {
        zPopupCallbacks[payload.svOpenId]?.callback(payload);
        zPopupCallbacks[payload.svOpenId] = null;
      }
    }
  );
}

const zPopupCallbackIds: {
  [K in string]?: string;
} = {};
export function useZPopupCallbackRegistry() {
  useMessageForwarded(
    { targetView: 'z-popup', type: 'register-subview-openid' },
    ({ payload }) => {
      if (!IS_RUNTIME_PRODUCTION) {
        console.debug('[debug] useZPopupCallbackRegistry:: payload', payload);
      }
      if (payload?.svOpenId) {
        zPopupCallbackIds[payload.subView] = payload.svOpenId;
      }
    }
  );
}

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

      if (Object.values(partials).some((v) => v?.visible)) {
        showMainwinPopupview({ type: 'z-popup' });
      } else {
        hideMainwinPopupview('z-popup');
      }
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

      const svOpenId = randString();
      if (typeof callback === 'function') {
        zPopupCallbacks[svOpenId] = {
          subView: svType,
          callback: callback as any,
        };
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
});

export function useZPopupViewStates() {
  const [svStates, setSvStates] = useAtom(ZPopupSubviewStateAtom);

  return { svStates, setSvStates };
}
export function useZPopupViewState<T extends keyof ZViewStates>(
  svType: T,
  onFieldsChanged?: (partials?: IZPopupSubviewState[T]) => void
) {
  const { svStates, setSvStates } = useZPopupViewStates();
  const sendToMain = useForwardTo('main-window');

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
    setSvStates((prev) => {
      const partials = {
        ...prev,
        [svType]: {
          ...prev[svType],
          visible: false,
        },
      };

      const svOpenId = zPopupCallbackIds[svType];
      delete zPopupCallbackIds[svType];
      sendToMain('consume-subview-openid', {
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
  }, [svType, setSvStates, sendToMain]);

  const { visible: svVisible, state: svState } = svStates[svType] || {};

  const setSvState = useCallback(
    (svPartials: IZPopupSubviewState[T]['state']) => {
      setSvStates((prev) => {
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
    [svType, setSvStates]
  );

  return {
    setSvState,
    svVisible: !!svVisible,
    svState,
    /**
     * @deprecated for compatibility
     */
    pageInfo: svStates[svType],
    closeSubview,
  };
}
