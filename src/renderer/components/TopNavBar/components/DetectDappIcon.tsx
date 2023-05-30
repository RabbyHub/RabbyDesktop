import clsx from 'clsx';

import { useGhostTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';
import { useRef } from 'react';

export default function DetectDappIcon({
  className,
  onForceReload,
}: {
  className?: string;
  onForceReload?: () => Promise<void> | void;
}) {
  const [{ showTooltip, hideTooltip }] = useGhostTooltip({
    mode: 'controlled',
    defaultTooltipProps: {
      title: 'New version detected. Refresh the page to update.',
      placement: 'bottom',
    },
  });

  const triggerRef = useRef<HTMLImageElement | null>(null);

  // if (!dappVersion.updated) return null;

  return (
    /* dappVersion.updated &&  */ <img
      className={clsx(className, 'cursor-pointer')}
      src="rabby-internal://assets/icons/top-bar/icon-dapp-newversion.svg"
      ref={triggerRef}
      onClick={async () => {
        hideTooltip();
        onForceReload?.();
        // confirmDappVersion();
      }}
      onMouseEnter={(e) => {
        if (!triggerRef.current) {
          return;
        }

        showTooltip(
          triggerRef.current,
          {},
          {
            extraData: {
              specialType: 'detect-dapp',
            },
          }
        );
      }}
      onMouseLeave={() => {
        hideTooltip();
      }}
    />
  );
}
