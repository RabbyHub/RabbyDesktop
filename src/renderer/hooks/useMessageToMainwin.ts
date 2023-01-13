import { isMainWinShellWebUI } from '@/isomorphic/url';
import { useCallback, useEffect } from 'react';

type MessagePayload =
  ChannelMessagePayload['__internal_forward:main-window:client-message']['send'][0];

const isMainWindow = isMainWinShellWebUI(window.location.href);

/**
 * @description this hooks is used to forward message from other BrowserViews to main window
 *
 * @example
 *
 * on main window:
 *
 * ```ts
 * useMessageForwardToMainwin('some-message-type', (payload) => {
 *   // do something
 * });
 * ```
 *
 * on other BrowserViews:
 *
 * ```ts
 * const forwardToMainwin = useMessageToMainwin('some-message-type');
 *
 * forwardToMainwin({
 *    type: 'some-message-type', // you can omit this field
 *    // other payload
 * });
 * ```
 */
export function useMessageForwardToMainwin<T extends MessagePayload['type']>(
  type: T,
  callback?: (payload: MessagePayload & { type: T }) => void
) {
  type Payload = MessagePayload & { type: T };

  const forwardTo = useCallback(
    (restPayload: Omit<Payload, 'type'> & { type?: T }) => {
      if (isMainWindow) {
        console.warn(
          `[useMessageForwardToMainwin] it's no expected to send from main window.`
        );
      }

      window.rabbyDesktop.ipcRenderer.sendMessage(
        '__internal_forward:main-window:client-message',
        {
          ...restPayload,
          type,
        }
      );
    },
    [type]
  );

  useEffect(() => {
    if (!isMainWindow) return;

    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_forward:main-window:client-message',
      (payload) => {
        if (payload.type === type) {
          callback?.(payload as any);
        }
      }
    );
  }, [type, callback]);

  return forwardTo;
}
