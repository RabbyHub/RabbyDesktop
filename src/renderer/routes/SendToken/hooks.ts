import { useEffect } from 'react';

export const useOnTxFinished = (
  cb: (payload: { success: boolean; hash: string }) => void
) => {
  useEffect(
    () =>
      window.rabbyDesktop.ipcRenderer.on(
        '__internal_push:rabbyx:session-broadcast-forward-to-desktop',
        (payload) => {
          if (payload.event !== 'transactionChanged') return;

          if (payload.data?.type === 'finished') {
            cb(payload.data);
          }
        }
      ),
    [cb]
  );
};
