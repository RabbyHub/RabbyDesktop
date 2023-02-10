import { isBuiltinView } from '@/isomorphic/url';
import { useCallback, useEffect } from 'react';

/**
 * @description this hooks is used to forward message from other BrowserViews to main window
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
type ChannelForwardMessagePayload = ChannelForwardMessageType['send'][0];
export function useForwardTo<
  T extends Pick<ChannelForwardMessagePayload, 'type' | 'targetView'>
>(targetView: T['targetView']) {
  type Payload = ChannelForwardMessagePayload & T;

  const forwardMessageTo = useCallback(
    (type: T['type'], restPayload: Omit<Payload, 'type' | 'targetView'>) => {
      if (!isBuiltinView(window.location.href, targetView)) {
        console.warn(
          `[useForwardTo] it's not expected to send message from ${targetView} to itself.`
        );
      }

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_forward:views:channel-message',
        {
          ...restPayload,
          targetView,
          type,
        } as any
      );
    },
    [targetView]
  );

  return forwardMessageTo;
}

export function useMessageForwarded<
  T extends Pick<ChannelForwardMessagePayload, 'type' | 'targetView'>
>(matches: T, callback?: (payload: ChannelForwardMessagePayload & T) => void) {
  const { targetView, type } = matches;
  useEffect(() => {
    if (!isBuiltinView(window.location.href, targetView)) return;

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:views:channel-message',
      (payload) => {
        if (payload.type === type) {
          callback?.(payload as any);
        }
      }
    );
  }, [targetView, type, callback]);
}

type MainWindowChannelMessage = ChannelForwardMessagePayload & {
  targetView: 'main-window';
};

export function useMessageForwardToMainwin<
  T extends MainWindowChannelMessage['type']
>(
  type: T,
  callback?: (payload: MainWindowChannelMessage & { type: T }) => void
) {
  const forwardTo = useForwardTo('main-window');
  useMessageForwarded({ targetView: 'main-window', type }, callback);

  return useCallback(
    (payload: Omit<MainWindowChannelMessage, 'targetView'> & { type: T }) => {
      return forwardTo(type, payload);
    },
    [forwardTo]
  );
}
