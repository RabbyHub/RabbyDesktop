import { useEffect, useState } from 'react';

export function useContextMenuPageInfo() {
  const [{ pageInfo }, setInfo] = useState<{
    visible: boolean;
    pageInfo: IContextMenuPageInfo | null;
  }>({
    visible: false,
    pageInfo: null,
  });

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:context-meunu-popup:on-visiblechange',
      (payload) => {
        if (payload.visible) {
          setInfo({
            visible: true,
            pageInfo: payload.pageInfo,
          });
        } else {
          setInfo({
            visible: false,
            pageInfo: null,
          });
        }
      }
    );
  }, []);

  return pageInfo;
}
