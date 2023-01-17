import { useCallback, useEffect, useState } from 'react';
import { hideMainwinPopupview } from '../ipcRequest/mainwin-popupview';

export function usePopupWinInfo<T extends IContextMenuPageInfo['type']>(
  type: T
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

  return {
    localVisible,
    setLocalVisible,
    visible: info.visible,
    pageInfo: info.pageInfo,
  };
}
export function usePopupViewInfo<T extends PopupViewOnMainwinInfo['type']>(
  type: T
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
      }
    );
  }, [type]);

  const hideView = useCallback(() => {
    setLocalVisible(false);
    hideMainwinPopupview(type);
  }, [type]);

  const hideViewOnly = useCallback(() => {
    hideMainwinPopupview(type);
  }, [type]);

  return {
    localVisible,
    setLocalVisible,
    hideView,
    hideViewOnly,
    visible: info.visible,
    pageInfo: info.pageInfo,
  };
}
