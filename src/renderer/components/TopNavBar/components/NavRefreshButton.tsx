import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';

import { useGhostTooltip } from '@/renderer/routes-popup/TopGhostWindow/useGhostWindow';
import { randString } from '@/isomorphic/string';

const TRIGGER_ID = `detect-dapp-${randString()}`;

export default function NavRefreshButton({
  className,
  onForceReload,
  btnStatus,
  stopLoadingBtn = null,
  normalRefreshBtn,
}: {
  className?: string;
  onForceReload?: () => Promise<void> | void;
  btnStatus?: 'dapp-updated' | 'loading';
  stopLoadingBtn?: React.ReactNode;
  normalRefreshBtn?: React.ReactNode;
}) {
  const [{ showTooltip, destroyTooltip }] = useGhostTooltip({
    mode: 'controlled',
    defaultTooltipProps: {
      title: 'New version detected. Refresh the page to update.',
      placement: 'bottom',
      overlayClassName: 'custom-newversion-tooltip',
      align: {
        offset: [0, -2],
      },
    },
    staticTriggerId: TRIGGER_ID,
  });

  const triggerRef = useRef<HTMLImageElement | null>(null);

  useLayoutEffect(() => {
    if (btnStatus === 'dapp-updated' && triggerRef.current) {
      showTooltip(
        triggerRef.current,
        {},
        {
          /** @warning don't destroy tooltip first, otherwise it will cause tooltip(on another webview) flicker */
          destroyFirst: false,
          extraData: {
            specialType: 'detect-dapp',
          },
        }
      );
    } else {
      destroyTooltip(0);
    }

    /** @warning don't destroy on unmount, it will cause tooltip(on another webview) flicker */
    // return () => {
    //   destroyTooltip();
    // }
  }, [btnStatus, showTooltip, destroyTooltip]);

  if (btnStatus === 'loading') return <>{stopLoadingBtn}</>;

  if (btnStatus !== 'dapp-updated') return <>{normalRefreshBtn}</>;

  return (
    <img
      className={clsx(className, 'cursor-pointer')}
      src="rabby-internal://assets/icons/top-bar/icon-dapp-newversion.svg"
      ref={triggerRef}
      onClick={async () => {
        destroyTooltip();
        onForceReload?.();
      }}
      onMouseEnter={(e) => {
        if (!triggerRef.current) {
          return;
        }

        showTooltip(
          triggerRef.current,
          {},
          {
            destroyFirst: false,
            extraData: {
              specialType: 'detect-dapp',
            },
          }
        );
      }}
      // onMouseLeave={() => {
      //   destroyTooltip();
      // }}
    />
  );
}
