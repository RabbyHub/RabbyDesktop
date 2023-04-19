import { useSubscribeRpm } from '@/renderer/hooks-shell/useShellWallet';
import { useEffect } from 'react';

export const useOnTxFinished = (
  cb: (payload: { success: boolean; hash: string }) => void
) => {
  const subscribeRpm = useSubscribeRpm();

  useEffect(
    () =>
      subscribeRpm((payload) => {
        if (payload.event !== 'transactionChanged') return;

        if (payload.data?.type === 'finished') {
          cb(payload.data);
        }
      }),
    [subscribeRpm, cb]
  );
};
