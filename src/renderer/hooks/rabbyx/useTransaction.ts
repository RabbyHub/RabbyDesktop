import { message } from 'antd';
import { useEffect } from 'react';

const DEBUG_DURACTION = 0;

export function useTransactionChanged() {
  useEffect(() => {
    return window.rabbyDesktop.ipcRenderer.on(
      '__internal_push:rabbyx:session-broadcast-forward-to-main',
      (payload) => {
        if (payload.event !== 'transactionChanged') return;
        switch (payload.data?.type) {
          default:
            break;
          case 'push-failed': {
            message.open({
              type: 'error',
              content: 'Transaction push failed',
              className: 'rabbyx-tx-changed-tip',
              // duration: DEBUG_DURACTION,
            });
            break;
          }
          case 'submitted': {
            message.open({
              type: 'success',
              content: 'Transaction submitted',
              className: 'rabbyx-tx-changed-tip',
              // duration: DEBUG_DURACTION,
            });
            break;
          }
          case 'finished': {
            if (payload.data?.success) {
              message.open({
                type: 'success',
                content: 'Transaction success',
                className: 'rabbyx-tx-changed-tip',
                // duration: DEBUG_DURACTION,
              });
            } else {
              message.open({
                type: 'error',
                content: 'Transaction failed',
                className: 'rabbyx-tx-changed-tip',
                // duration: DEBUG_DURACTION,
              });
            }
            break;
          }
        }
      }
    );
  }, []);
}
