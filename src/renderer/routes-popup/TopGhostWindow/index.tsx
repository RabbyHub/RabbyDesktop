import clsx from 'clsx';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import '@/renderer/css/style.less';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { atom, useAtom } from 'jotai';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import styles from './index.module.less';

const eleTooltipsAtom = atom<(ITriggerTooltipOnGhost & object)[]>([]);

function TooltipsFromOtherViews() {
  const [eleTooltips, setEleTooltips] = useAtom(eleTooltipsAtom);
  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useState(false);

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:top-ghost-window:toggle-visible',
      !!eleTooltips.length
    );
  }, [eleTooltips.length]);

  useBodyClassNameOnMounted(
    clsx([
      'win-top-ghost-window',
      !IS_RUNTIME_PRODUCTION && isGhostWindowDebugHighlighted && 'isDebug',
    ])
  );

  useMessageForwarded(
    {
      targetView: 'top-ghost-window',
      type: 'debug:toggle-highlight',
    },
    (data) => {
      setIsGhostWindowDebugHighlighted(!!data.payload.isHighlight);
    }
  );

  useMessageForwarded(
    {
      targetView: 'top-ghost-window',
      type: 'trigger-tooltip',
    },
    (data) => {
      setEleTooltips((prev) => {
        const theOneIdx = prev.findIndex(
          (item) => item.triggerId === data.payload.triggerId
        );

        let theOne = prev[theOneIdx];
        const existed = !!prev[theOneIdx];

        const isToShow = !!data.payload.triggerElementRect;

        if (!isToShow) {
          if (existed) prev.splice(theOneIdx, 1);

          return [...prev];
        }

        if (!theOne) {
          theOne = {
            triggerId: data.payload.triggerId,
          };
        }

        theOne.triggerElementRect = data.payload.triggerElementRect;
        theOne.tooltipProps = data.payload.tooltipProps;
        theOne.extraData = data.payload.extraData;

        if (!existed) {
          return [...prev, theOne];
        }

        return [...prev];
      });
    }
  );

  return (
    <div className={styles.winWrapper}>
      {eleTooltips.map((eleInfo) => {
        const triggerRect = eleInfo.triggerElementRect;

        return (
          <Tooltip
            key={`ele-on-ghost-${eleInfo.triggerId}`}
            {...eleInfo.tooltipProps}
            open={!!triggerRect && eleInfo.tooltipProps?.open}
          >
            <div
              style={{
                position: 'fixed',
                ...(triggerRect && {
                  left: triggerRect.left,
                  top: triggerRect.top,
                  width: triggerRect.width,
                  height: triggerRect.height,
                }),
              }}
              className={clsx(
                'trigger-ele-placeholder',
                !IS_RUNTIME_PRODUCTION &&
                  isGhostWindowDebugHighlighted &&
                  'isDebug'
              )}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}

function SpecialTooltips() {
  const [newVersionRect, setNewVersionRect] = useState<DOMRectValues | null>(
    null
  );
  const [newVersionRectVisible, setNewVersionRectVisible] = useState(false);
  useMessageForwarded(
    {
      targetView: 'top-ghost-window',
      type: 'report-special-tooltip',
    },
    (payload) => {
      setNewVersionRect(payload.payload.rect);
    }
  );

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:version-updated',
      (payload) => {
        setNewVersionRectVisible(
          !!payload.currentDappId && payload.result.updated
        );
      }
    );
  }, []);

  return (
    <>
      <Tooltip
        open={!!newVersionRect && newVersionRectVisible}
        title="New version detected. Refresh the page to update."
        placement="bottom"
        overlayClassName="custom-newversion-tooltip"
        align={{
          offset: [0, -2],
        }}
      >
        <div
          style={{
            position: 'fixed',
            ...(newVersionRect && {
              left: newVersionRect.left,
              top: newVersionRect.top,
              width: newVersionRect.width,
              height: newVersionRect.height,
            }),
          }}
          className={clsx(
            'trigger-ele-placeholder'
            // !IS_RUNTIME_PRODUCTION &&
            //   isGhostWindowDebugHighlighted &&
            //   'isDebug'
          )}
        />
      </Tooltip>
    </>
  );
}

export default function TopGhostWindow() {
  return (
    <>
      <TooltipsFromOtherViews />
      <SpecialTooltips />
    </>
  );
}
