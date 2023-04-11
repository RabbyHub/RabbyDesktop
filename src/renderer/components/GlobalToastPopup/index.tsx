import { IS_RUNTIME_PRODUCTION } from '@/isomorphic/constants';
import { useClickOutSide } from '@/renderer/hooks/useClick';
import { useBodyClassNameOnMounted } from '@/renderer/hooks/useMountedEffect';
import { usePopupViewInfo } from '@/renderer/hooks/usePopupWinOnMainwin';
import { hideMainwinPopupview } from '@/renderer/ipcRequest/mainwin-popupview';
import { message } from 'antd';
import { useRef } from 'react';

import './index.less';
import { toastMessage } from '../TransparentToast';

hideMainwinPopupview('global-toast-popup');

const TOASTKEY = 'global-toast-key';
export default function GlobalToastPopup() {
  useBodyClassNameOnMounted('global-toast-popup');

  const contentRef = useRef<any>(null);
  const { delayHideView } = usePopupViewInfo('global-toast-popup', {
    onVisibleChanged(payload) {
      if (!payload.visible) {
        return;
      }
      switch (payload.pageInfo.state?.toastType) {
        case 'foo':
          message.destroy(TOASTKEY);
          message.open({
            type: 'error',
            key: TOASTKEY,
            content: <span ref={contentRef}>Nothing but for demo</span>,
            onClose: () => {
              delayHideView(300);
            },
            onClick: () => {
              message.destroy(TOASTKEY);
              delayHideView(300);
            },
            // duration: 0,
          });
          break;
        case 'toast-message':
          message.destroy(TOASTKEY);
          toastMessage({
            key: TOASTKEY,
            type: payload.pageInfo.state.data.type,
            content: payload.pageInfo.state.data.content,
            duration: payload.pageInfo.state.data.duration || 3,
            onClose: () => {
              delayHideView(300);
            },
          });
          break;
        default:
          break;
      }
    },
  });

  useClickOutSide(contentRef, () => {
    message.destroy(TOASTKEY);
    delayHideView(300);
  });

  return null;
}
