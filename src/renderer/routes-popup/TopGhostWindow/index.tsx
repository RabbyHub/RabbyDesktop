import clsx from 'clsx';

import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';

import '@/renderer/css/style.less';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { useMessageForwarded } from '@/renderer/hooks/useViewsMessage';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Tooltip } from 'antd';
import { useEffect, useMemo } from 'react';
import styles from './index.module.less';

const eleTooltipsAtom = atom<(ITriggerTooltipOnGhost & object)[]>([]);

type ISpecialKey = 'new-version-updated';
const specialTooltipsAtom = atom<{
  [K in ISpecialKey]?: {
    name?: string;
    rectValues: DOMRectValues | null;
    visible: boolean;
  };
}>({});

const isGhostWindowDebugHighlightedAtom = atom(false);

function TooltipsFromOtherViews() {
  const [eleTooltips, setEleTooltips] = useAtom(eleTooltipsAtom);
  const isGhostWindowDebugHighlighted = useAtomValue(
    isGhostWindowDebugHighlightedAtom
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
  const [specialTooltips, setSpecialTooltips] = useAtom(specialTooltipsAtom);

  const newVersionTooltip = useMemo(() => {
    return specialTooltips['new-version-updated'];
  }, [specialTooltips]);

  const newVersionRect = newVersionTooltip?.rectValues;
  const newVersionRectVisible = newVersionTooltip?.visible;

  useMessageForwarded(
    {
      targetView: 'top-ghost-window',
      type: 'report-special-tooltip',
    },
    (payload) => {
      setSpecialTooltips((prev) => {
        return {
          ...prev,
          'new-version-updated': {
            ...prev['new-version-updated'],
            rectValues: payload.payload.rect,
            visible: prev['new-version-updated']?.visible ?? false,
          },
        };
      });
    }
  );

  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:dapps:version-updated',
      (payload) => {
        setSpecialTooltips((prev) => {
          return {
            ...prev,
            'new-version-updated': {
              ...prev['new-version-updated'],
              rectValues: prev['new-version-updated']?.rectValues ?? null,
              visible: !!payload.currentDappId && payload.result.updated,
            },
          };
        });
      }
    );
  }, [setSpecialTooltips]);

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
        transitionName=""
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
  const [eleTooltips] = useAtom(eleTooltipsAtom);
  const [specialTooltips] = useAtom(specialTooltipsAtom);

  const tooltipCountToShow = useMemo(() => {
    return (
      eleTooltips.length +
      Object.values(specialTooltips).filter((item) => item.visible).length
    );
  }, [eleTooltips, specialTooltips]);

  useEffect(() => {
    window.rabbyDesktop.ipcRenderer.sendMessage(
      '__internal_rpc:top-ghost-window:toggle-visible',
      !!tooltipCountToShow
    );
  }, [tooltipCountToShow]);

  const [isGhostWindowDebugHighlighted, setIsGhostWindowDebugHighlighted] =
    useAtom(isGhostWindowDebugHighlightedAtom);

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

  return (
    <>
      <TooltipsFromOtherViews />
      <SpecialTooltips />
    </>
  );
}
