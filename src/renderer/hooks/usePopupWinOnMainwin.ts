import { useCallback, useEffect, useRef, useState } from 'react';
import { hideMainwinPopup } from '../ipcRequest/mainwin-popup';
import { hideMainwinPopupview } from '../ipcRequest/mainwin-popupview';

export function usePopupWinInfo<T extends IContextMenuPageInfo['type']>(
  type: T,
  opts?: {
    enableTopViewGuard?: boolean;
  }
) {
  const [localVisible, setLocalVisible] = useState(false);

  const [info, setInfo] = useState<{
    visible: boolean;
    pageInfo: (IContextMenuPageInfo & { type: typeof type }) | null;
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
  }, [type, opts?.onVisibleChanged]);

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
