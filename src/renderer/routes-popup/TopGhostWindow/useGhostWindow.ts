import { arraify } from '@/isomorphic/array';
import { detectClientOS } from '@/isomorphic/os';
import { randString } from '@/isomorphic/string';
import { forwardMessageTo } from '@/renderer/hooks/useViewsMessage';
import { showMainwinPopup } from '@/renderer/ipcRequest/mainwin-popup';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useClickAway } from 'react-use';

const osType = detectClientOS();

function toggleTooltipShow(
  payload: ITriggerTooltipOnGhost,
  options?: {
    showWinPopupFirstOnShow?: boolean;
  }
) {
  if (payload.triggerElementRect) {
    if (options?.showWinPopupFirstOnShow && osType !== 'darwin') {
      // avoid pull window to front on macos
      showMainwinPopup({ x: 0, y: 0 }, { type: 'top-ghost-window' });
    }
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

const DEFAULT_REF = {
  isRemoteRendered: false,
  lastRect: null,
  lastTooltipProps: null,
};

type IShowTooltipOpts = {
  extraData?: ITriggerTooltipOnGhost['extraData'];
  destroyFirst?: boolean;
};

/**
 *
 * TODO: we should restrain calling this hook from non-ghost view only
 */
export function useGhostTooltip<T extends HTMLElement = HTMLDivElement>({
  mode = 'controlled',
  defaultTooltipProps,
  staticTriggerId,
  uncontrolledOptions,
}: {
  mode?: 'controlled' | 'uncontrolled';
  defaultTooltipProps?: ITriggerTooltipOnGhost['tooltipProps'];
  staticTriggerId?: string;
  uncontrolledOptions?: {
    /**
     * @description hide tooltip when click away from trigger element
     */
    destroyOnClickAway?: boolean;
  };
}) {
  const triggerElRef = useRef<T>(null);
  const actionRef = useRef<{
    triggerId: string;
    isRemoteRendered: boolean;
    lastRect?: null | DOMRect;
    lastTooltipProps?: null | ITriggerTooltipOnGhost['tooltipProps'];
  }>({
    triggerId: staticTriggerId || randString(),
    ...DEFAULT_REF,
  });

  const { destroyOnClickAway = true } = uncontrolledOptions || {};

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

  const doDestroyTooltip = useCallback(() => {
    const triggerId = actionRef.current.triggerId;

    // reset
    actionRef.current = {
      ...DEFAULT_REF,
      triggerId: actionRef.current.triggerId,
    };

    toggleTooltipShow({
      triggerId,
      triggerElementRect: undefined,
      tooltipProps: undefined,
    });

    actionRef.current.isRemoteRendered = false;
  }, []);

  const doShowTooltip = useCallback(
    (
      elOrRect: HTMLElement | ITriggerTooltipOnGhost['triggerElementRect'],
      tooltipProps: ITriggerTooltipOnGhost['tooltipProps'],
      opts?: IShowTooltipOpts
    ) => {
      const triggerId = actionRef.current.triggerId;

      const triggerElementRect =
        elOrRect instanceof HTMLElement
          ? elOrRect.getBoundingClientRect().toJSON()
          : elOrRect;

      actionRef.current.lastRect = triggerElementRect;
      actionRef.current.lastTooltipProps = tooltipProps;

      const { destroyFirst = true } = opts || {};

      if (destroyFirst && actionRef.current.isRemoteRendered) {
        doDestroyTooltip();
      }

      toggleTooltipShow({
        triggerId,
        triggerElementRect,
        tooltipProps: {
          ...defaultTooltipProps,
          ...tooltipProps,
          open: true,
          visible: true,
        },
        extraData: opts?.extraData,
      });
      actionRef.current.isRemoteRendered = true;
    },
    [doDestroyTooltip, defaultTooltipProps]
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

      doDestroyTooltip();
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

      doDestroyTooltip();
    };
  }, [isControlledMode, defaultTooltipProps, doShowTooltip, doDestroyTooltip]);

  const showTooltip = useCallback(
    (
      elOrRect: HTMLElement | ITriggerTooltipOnGhost['triggerElementRect'],
      tooltipProps: ITriggerTooltipOnGhost['tooltipProps'],
      opts?: {
        /**
         * @description timeout after when tooltip auto hide, zero means no auto hide
         * @default 0
         */
        autoDestroyTimeout?: number;
      } & IShowTooltipOpts
    ) => {
      if (!isControlledMode('showTooltip')) return;

      doShowTooltip(elOrRect, tooltipProps, {
        extraData: opts?.extraData,
        destroyFirst: opts?.destroyFirst,
      });

      const { autoDestroyTimeout = 0 } = opts || {};

      if (autoDestroyTimeout) {
        setTimeout(() => {
          if (!actionRef.current.isRemoteRendered) return;

          doDestroyTooltip();
        }, autoDestroyTimeout);
      }
    },
    [isControlledMode, doShowTooltip, doDestroyTooltip]
  );

  const hideTooltip = useCallback(() => {
    if (!isControlledMode('hideTooltip')) return;

    if (!actionRef.current.isRemoteRendered) return;

    const triggerId = actionRef.current.triggerId;
    const triggerElementRect = actionRef.current.lastRect || undefined;
    const tooltipProps = actionRef.current.lastTooltipProps || undefined;

    toggleTooltipShow(
      {
        triggerId,
        triggerElementRect,
        tooltipProps: {
          ...defaultTooltipProps,
          ...tooltipProps,
          open: false,
          visible: false,
        },
      },
      { showWinPopupFirstOnShow: false }
    );
  }, [isControlledMode, defaultTooltipProps]);

  const destroyTooltip = useCallback(
    (timeoutVal = 250) => {
      if (!isControlledMode('destroyTooltip')) return;

      if (!actionRef.current.isRemoteRendered) return;

      if (timeoutVal) {
        setTimeout(() => doDestroyTooltip(), timeoutVal);
      } else {
        doDestroyTooltip();
      }
    },
    [isControlledMode, doDestroyTooltip]
  );

  useClickAway(triggerElRef, () => {
    if (destroyOnClickAway) {
      destroyTooltip();
    }
  });

  return [
    {
      triggerElRef,
      showTooltip,
      destroyTooltip,
      hideTooltip,
    },
  ] as const;
}
