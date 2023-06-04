import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';

import { reportRectForSpecialTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';
import { usePrevious } from 'react-use';

import { RcIconReloadUpdate } from '@/../assets/icons/top-bar';

export default function NavRefreshButton({
  className,
  onForceReload,
  currentDappId,
  btnStatus,
  stopLoadingBtn = null,
  normalRefreshBtn,
}: {
  className?: string;
  onForceReload?: () => Promise<void> | void;
  currentDappId?: string;
  btnStatus?: 'dapp-updated' | 'loading';
  stopLoadingBtn?: React.ReactNode;
  normalRefreshBtn?: React.ReactNode;
}) {
  const newVersionImageRef = useRef<HTMLImageElement | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (btnStatus === 'dapp-updated') {
      reportRectForSpecialTooltip({
        type: 'new-version-updated',
        rect: divRef.current?.getBoundingClientRect(),
      });
    } else if (btnStatus === 'loading') {
      reportRectForSpecialTooltip({
        type: 'new-version-updated',
        rect: null,
      });
    }
  }, [btnStatus]);

  const prevDappId = usePrevious(currentDappId);
  useLayoutEffect(() => {
    if (currentDappId && prevDappId !== currentDappId) {
      reportRectForSpecialTooltip({
        type: 'new-version-updated',
        rect: divRef.current?.getBoundingClientRect(),
      });
    }
  }, [prevDappId, currentDappId]);

  const obsRef = useRef<ResizeObserver>(
    new ResizeObserver(() => {
      reportRectForSpecialTooltip({
        type: 'new-version-updated',
        rect: divRef.current?.getBoundingClientRect(),
      });
    })
  );

  useLayoutEffect(() => {
    const divEl = divRef.current;
    const obs = obsRef.current!;

    if (!divEl) return;

    obs.observe(divEl);

    return () => {
      obs.unobserve(divEl);
      reportRectForSpecialTooltip({
        type: 'new-version-updated',
        rect: null,
      });
    };
  }, []);

  return (
    <div className="w-[20px] h-[20px]" ref={divRef}>
      {btnStatus === 'loading' ? (
        stopLoadingBtn
      ) : btnStatus !== 'dapp-updated' ? (
        normalRefreshBtn
      ) : (
        <RcIconReloadUpdate
          className="w-[100%] h-[100%]"
          // ref={newVersionImageRef}
          onClick={async () => {
            onForceReload?.();
          }}
          onMouseEnter={() => {
            reportRectForSpecialTooltip({
              type: 'new-version-updated',
              rect: divRef.current?.getBoundingClientRect(),
            });
          }}
        />
      )}
    </div>
  );
}
