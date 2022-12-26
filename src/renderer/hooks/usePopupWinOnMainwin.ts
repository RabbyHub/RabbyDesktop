import { useEffect, useState } from 'react';

export function usePopupWinInfo<T extends IContextMenuPageInfo['type']>(
  type: T
) {
  const [{ pageInfo }, setInfo] = useState<{
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
        } else {
          setInfo({
            visible: false,
            pageInfo: null,
          });
        }
      }
    );
  }, [type]);

  return pageInfo;
}
