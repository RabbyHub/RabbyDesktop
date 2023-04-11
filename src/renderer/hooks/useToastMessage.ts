/// <reference path="../../isomorphic/types.d.ts" />

import { toastMessage } from '../components/TransparentToast';
import { useMessageForwarded } from './useViewsMessage';

export function useToastMessage() {
  useMessageForwarded(
    {
      type: 'toast-message',
      targetView: 'main-window',
    },
    (payload) => {
      console.log(payload);
      if (!payload?.data) return;
      toastMessage(payload?.data);
    }
  );
}
