import clsx from 'clsx';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import '@/renderer/css/ant-message.less';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { atom, useAtom } from 'jotai';
import { Tooltip } from 'antd';
import { useState } from 'react';
import styles from './index.module.less';

const eleTooltipsAtom = atom<(ITriggerTooltipOnGhost & object)[]>([]);

export default function TopGhostWindow() {
  const [eleTooltips, setEleTooltips] = useAtom(eleTooltipsAtom);
  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useState(false);

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
            open={!!triggerRect}
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
