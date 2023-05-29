import { useDetectDappVersion } from '@/renderer/hooks-shell/useDappNavigation';
import clsx from 'clsx';

import { useGhostTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';
import { useRef } from 'react';
import styles from '../index.module.less';

export default function DetectDappIcon({
  onForceReload,
}: {
  onForceReload?: () => Promise<void> | void;
}) {
  const [{ showTooltip, hideTooltip }] = useGhostTooltip({
    mode: 'controlled',
    defaultTooltipProps: {
      title: 'New version detected',
      placement: 'bottom',
    },
  });

  const triggerRef = useRef<HTMLImageElement | null>(null);

  // if (!dappVersion.updated) return null;

  return (
    /* dappVersion.updated &&  */ <img
      className={clsx(styles.newVersionIcon, 'cursor-pointer')}
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
