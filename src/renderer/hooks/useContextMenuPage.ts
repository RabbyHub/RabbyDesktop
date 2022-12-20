import { useEffect, useState } from 'react';

export function useContextMenuPageInfo() {
  const [pageInfo, setPageInfo] = useState<IContextMenuPageInfo | null>(null);

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:context-meunu-popup:on-show',
      (payload) => {
        setPageInfo(payload.pageInfo);
      }
    );
  }, []);

  return pageInfo;
}
