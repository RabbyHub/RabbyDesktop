import { isBuiltinView } from '@/isomorphic/url';
import { useCallback, useEffect, useRef } from 'react';

/**
 * @description this hooks is used to forward message from other BrowserViews to main window
 * @deprecated use `forwardMessageTo` directly
 *
 * @example
 *
 * on target view:
 *
 * ```ts
 * useMessageForwarded('*', 'some-message-type', (payload) => {
 *   // do something
 * });
 * ```
 *
 * on source view:
 *
 * ```ts
 * const sendMessage = useForwardTo('*'); // send to all built-in views on mainWindow
 * const sendMessage = useForwardTo('add-address'); // send to specific built-in view
 *
 * // define/find valid type in `src/preloads/forward.d.ts`
 * sendMessage('some-message-type', ...);
 * ```
 */
export function useForwardTo<TV extends keyof ForwardMessageViewTypes>(
  targetView: TV
) {
  const forwardMessage = useCallback(
    <TT extends ForwardMessageViewTypes[TV]>(
      type: TT,
      restPayload: Omit<
        ChannelForwardMessageType & { targetView: TV; type: TT },
        'type' | 'targetView'
      >
    ) => {
      if (!isBuiltinView(window.location.href, targetView)) {
        console.warn(
          `[useForwardTo] it's not expected to send message from non built-in view '${targetView}'.`
        );
      }

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_forward:views:channel-message',
        {
          ...restPayload,
          targetView,
          type,
        } as ChannelForwardMessageType
      );
    },
    [targetView]
  );

  return forwardMessage;
}

export function forwardMessageTo<
  T extends keyof ForwardMessageViewTypes,
  U extends ForwardMessageViewTypes[T]
>(
  targetView: T,
  type: U,
  restPayload: Omit<
    ChannelForwardMessageType & { targetView: T; type: U },
    'type' | 'targetView'
  >
) {
  // if (!isBuiltinView(window.location.href, targetView)) {
  //   console.warn(
  //     `[forwardMessageTo] it's not expected to send message from non built-in view '${targetView}'.`
  //   );
  // }

  window.rabbyDesktop.ipcRenderer.sendMessage(
    '__internal_forward:views:channel-message',
    {
      ...restPayload,
      targetView,
      type,
    } as any
  );
}

export function useMessageForwarded<
  T extends Pick<ChannelForwardMessageType, 'type' | 'targetView'>
>(matches: T, callback?: (payload: ChannelForwardMessageType & T) => void) {
  const { targetView, type } = matches;
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;

    if (!isBuiltinView(window.location.href, targetView)) return;

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:views:channel-message',
      (payload) => {
        if (payload.type === type) {
          const cb = callbackRef.current;
          cb?.(payload as any);
        }
      }
    );
  }, [targetView, type, callback]);
}

type MainWindowChannelMessage = ChannelForwardMessageType & {
  targetView: 'main-window';
};

export function useMessageForwardToMainwin<
  T extends MainWindowChannelMessage['type']
>(
  type: T,
  callback?: (payload: MainWindowChannelMessage & { type: T }) => void
) {
  useMessageForwarded({ targetView: 'main-window', type }, callback);

  return useCallback(
    (payload: Omit<MainWindowChannelMessage, 'targetView'> & { type?: T }) => {
      return forwardMessageTo('main-window', type, payload as any);
    },
    [type]
  );
}
