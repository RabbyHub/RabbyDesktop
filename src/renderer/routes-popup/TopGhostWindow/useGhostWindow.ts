import { arraify } from '@/isomorphic/array';
import { randString } from '@/isomorphic/string';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useClickAway } from 'react-use';

function toggleTooltipShow(payload: ITriggerTooltipOnGhost) {
  if (payload.triggerElementRect) {
    showMainwinPopup({ x: 0, y: 0 }, { type: 'top-ghost-window' });
    forwardMessageTo('top-ghost-window', 'trigger-tooltip', {
      payload,
    });
  } else {
    forwardMessageTo('top-ghost-window', 'trigger-tooltip', {
      payload: {
        triggerId: payload.triggerId,
        triggerElementRect: undefined,
        tooltipProps: undefined,
      },
    });
  }
}

/**
 *
 * TODO: we should restrain calling this hook from non-ghost view only
 */
export function useGhostTooltip<T extends HTMLElement = HTMLDivElement>({
  mode = 'controlled',
  defaultTooltipProps,
  uncontrolledOptions,
}: {
  mode?: 'controlled' | 'uncontrolled';
  defaultTooltipProps?: ITriggerTooltipOnGhost['tooltipProps'];
  uncontrolledOptions?: {
    /**
     * @description hide tooltip when click away from trigger element
     */
    hideOnClickAway?: boolean;
  };
}) {
  const triggerElRef = useRef<T>(null);
  const actionRef = useRef<{
    triggerId: string;
    isOpen: boolean;
  }>({
    triggerId: randString(),
    isOpen: false,
  });

  const { hideOnClickAway = true } = uncontrolledOptions || {};

  const isControlledMode = useCallback(
    (fnName?: string) => {
      const itIs = mode === 'controlled';
      if (fnName && !itIs) {
        console.warn(`'${fnName}' is only available in controlled mode`);
        return false;
      }

      return itIs;
    },
    [mode]
  );

  const doHideTooltip = useCallback(() => {
    const triggerId = actionRef.current.triggerId;

    actionRef.current.isOpen = false;
    toggleTooltipShow({
      triggerId,
      triggerElementRect: undefined,
      tooltipProps: undefined,
    });
  }, []);

  const doShowTooltip = useCallback(
    (
      elOrRect: HTMLElement | ITriggerTooltipOnGhost['triggerElementRect'],
      tooltipProps: ITriggerTooltipOnGhost['tooltipProps'],
      opts?: {
        extraData?: ITriggerTooltipOnGhost['extraData'];
      }
    ) => {
      const triggerId = actionRef.current.triggerId;

      const triggerElementRect =
        elOrRect instanceof HTMLElement
          ? elOrRect.getBoundingClientRect().toJSON()
          : elOrRect;

      if (actionRef.current.isOpen) {
        doHideTooltip();
      }

      toggleTooltipShow({
        triggerId,
        triggerElementRect,
        tooltipProps: {
          ...defaultTooltipProps,
          ...tooltipProps,
        },
        extraData: opts?.extraData,
      });
      actionRef.current.isOpen = true;
    },
    [doHideTooltip, defaultTooltipProps]
  );

  useLayoutEffect(() => {
    const triggerEl = triggerElRef.current;
    if (!triggerEl) return;

    const listenerOpen = (evt: MouseEvent) => {
      if (isControlledMode('listenerOpen')) return;
      if (!triggerEl.contains(evt.target as any)) return;

      doShowTooltip(triggerEl, {});
    };

    const listenerClose = (evt: MouseEvent) => {
      if (isControlledMode('listenerClose')) return;
      if (!triggerEl.contains(evt.target as any)) return;

      doHideTooltip();
    };

    const triggerActions = arraify(defaultTooltipProps?.trigger).filter(
      Boolean
    );
    if (triggerActions.includes('hover')) {
      triggerEl.addEventListener('mouseenter', listenerOpen);
      triggerEl.addEventListener('mouseleave', listenerClose);
    }
    if (triggerActions.includes('click')) {
      triggerEl.addEventListener('click', listenerOpen);
    }

    return () => {
      triggerEl.removeEventListener('mouseenter', listenerOpen);
      triggerEl.removeEventListener('mouseleave', listenerClose);
      triggerEl.removeEventListener('click', listenerOpen);

      doHideTooltip();
    };
  }, [isControlledMode, defaultTooltipProps, doShowTooltip, doHideTooltip]);

  const showTooltip = useCallback(
    (
      elOrRect: HTMLElement | ITriggerTooltipOnGhost['triggerElementRect'],
      tooltipProps: ITriggerTooltipOnGhost['tooltipProps'],
      opts?: {
        /**
         * @description timeout after when tooltip auto hide, zero means no auto hide
         * @default 0
         */
        autoHideTimeout?: number;
        extraData?: ITriggerTooltipOnGhost['extraData'];
      }
    ) => {
      if (!isControlledMode('showTooltip')) return;

      doShowTooltip(elOrRect, tooltipProps, { extraData: opts?.extraData });

      const { autoHideTimeout = 0 } = opts || {};

      if (autoHideTimeout) {
        setTimeout(() => {
          if (!actionRef.current.isOpen) return;

          doHideTooltip();
        }, autoHideTimeout);
      }
    },
    [isControlledMode, doShowTooltip, doHideTooltip]
  );

  const hideTooltip = useCallback(
    (timeoutVal = 250) => {
      if (!isControlledMode('hideTooltip')) return;

      if (!actionRef.current.isOpen) return;

      if (timeoutVal) {
        setTimeout(() => doHideTooltip(), timeoutVal);
      } else {
        doHideTooltip();
      }
    },
    [isControlledMode, doHideTooltip]
  );

  useClickAway(triggerElRef, () => {
    if (hideOnClickAway) {
      hideTooltip();
    }
  });

  return [
    {
      triggerElRef,
      showTooltip,
      hideTooltip,
    },
  ] as const;
}
