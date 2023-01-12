import {
  hideMainwinPopup,
  showMainwinPopup,
} from '@/renderer/ipcRequest/mainwin-popup';
import classNames from 'classnames';
import { useLayoutEffect, useRef } from 'react';

export function GasketPopupWin({
  className,
  pageInfo,
  openDevTools,
}: React.PropsWithChildren<{
  className?: string;
  pageInfo: IContextMenuPageInfo;
  openDevTools?: boolean;
}>) {
  const divRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const divEl = divRef.current;

    if (!divEl) return;

    const elRect = divEl.getBoundingClientRect();
    showMainwinPopup(
      {
        x: Math.round(elRect.x),
        y: Math.round(elRect.y),
      },
      pageInfo,
      { openDevTools }
    );

    return () => {
      hideMainwinPopup(pageInfo.type);
    };
  }, [pageInfo, openDevTools, pageInfo.type]);

  return (
    <div
      ref={divRef}
      className={classNames(`${pageInfo.type}-gasket`, className)}
    />
  );
}
