import { message } from 'antd';
import { useRef } from 'react';
import { useClickOutSide } from '../hooks/useClick';
import { useMessageForwardToMainwin } from '../hooks/useViewsMessage';

const TOASTKEY = 'mainwindow:global-toast-key';
export function useMainWindowEventsToast() {
  const contentRef = useRef<any>(null);
  useMessageForwardToMainwin('toast-on-mainwin', (payload) => {
    switch (payload.data.type) {
      case 'ledger-connect-failed':
        message.destroy(TOASTKEY);
        message.open({
          type: 'error',
          key: TOASTKEY,
          content: (
            <span ref={contentRef}>
              Unable to connect to Hardware wallet. Please try to re-connect.
              <div>{payload.data?.message}</div>
            </span>
          ),
          onClose: () => {},
          onClick: () => {
            message.destroy(TOASTKEY);
          },
        });
        break;
      default:
        break;
    }
  });

  useClickOutSide(contentRef, () => {
    message.destroy(TOASTKEY);
  });
}
